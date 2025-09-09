import Job from '../models/Job.js';
import { createPaginationResponse } from '../utils/helpers.js';
import logger from '../utils/logger.js';

// @desc    Create a new internal job posting
// @route   POST /api/jobs
// @access  Private (Placement Officer/Admin)
const createJob = async (req, res) => {
  try {
    const { company, title, description, location, jobType, ctc, deadline, minCgpa } = req.body

    if (!company || !title || !description || !location || !jobType) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    const job = new Job({
      company,
      title,
      description,
      location,
      jobType,
      ctc,
      deadline,
      minCgpa: Number(minCgpa) || 0,
      createdBy: req.user?.id || null
    })

    await job.save()

    res.status(201).json({ success: true, data: job })
  } catch (error) {
    logger.error('Create job error:', error)
    res.status(500).json({ success: false, message: 'Server error while creating job' })
  }
}

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const location = req.query.location;
    const jobType = req.query.jobType;
    const branch = req.query.branch;
    const minCgpa = req.query.minCgpa;
    const studentId = req.query.studentId;

    let query = { status: 'active' };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (jobType) {
      query.jobType = jobType;
    }
    
    if (branch) {
      query.$or = [
        { branches: branch },
        { branches: 'All' }
      ];
    }

    if (minCgpa !== undefined) {
      const cgpaNumber = Number(minCgpa)
      const cgpaCond = { $or: [ { minCgpa: { $lte: isNaN(cgpaNumber) ? 0 : cgpaNumber } }, { minCgpa: { $eq: null } }, { minCgpa: { $exists: false } } ] }
      // If there's already an $or (e.g., branches), preserve it inside $and
      if (query.$or) {
        query.$and = query.$and || []
        query.$and.push({ $or: query.$or })
        delete query.$or
      }
      query.$and = query.$and || []
      query.$and.push(cgpaCond)
    }

    const skip = (page - 1) * limit;
    
    let jobs = await Job.find(query)
      .populate('company', 'name companyDetails.companyName companyDetails.industry')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Additional server-side filter: if a cgpa value is provided (explicit or via studentId),
    // also infer from description when field is missing
    let cgpaNumber = undefined
    if (minCgpa !== undefined) {
      cgpaNumber = Number(minCgpa)
    }
    if (studentId && cgpaNumber === undefined) {
      // Try to derive student's CGPA from populated onboarding data if available elsewhere in the stack
      // If not available here, rely on minCgpa query provided by the client
    }
    if (cgpaNumber !== undefined) {
      const parseMinCgFromText = (text) => {
        if (!text || typeof text !== 'string') return 0
        const patterns = [
          /minimum\s*cgpa\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
          /min\.?\s*cgpa\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
          /cgpa\s*(?:>=|at\s*least|minimum\s*of)?\s*(\d+(?:\.\d+)?)/i
        ]
        for (const rx of patterns) {
          const m = rx.exec(text)
          if (m) {
            const v = parseFloat(m[1])
            if (!isNaN(v)) return v
          }
        }
        return 0
      }
      jobs = jobs.filter((j) => {
        const field = typeof j.minCgpa === 'number' ? j.minCgpa : (typeof j.minCgpa === 'string' && !isNaN(parseFloat(j.minCgpa)) ? parseFloat(j.minCgpa) : null)
        const fromText = parseMinCgFromText(j.description)
        const required = field !== null ? field : fromText
        if (required === null || isNaN(required)) return true
        return required <= (isNaN(Number(cgpaNumber)) ? 0 : Number(cgpaNumber))
      })
    }

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: createPaginationResponse(jobs, total, page, limit)
    });

  } catch (error) {
    logger.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching jobs'
    });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name companyDetails.companyName companyDetails.industry companyDetails.website');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment views
    job.views += 1;
    await job.save();

    res.json({
      success: true,
      data: { job }
    });

  } catch (error) {
    logger.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching job'
    });
  }
};

// @desc    Update a job posting
// @route   PUT /api/jobs/:id
// @access  Private (Placement Officer/Admin)
const updateJob = async (req, res) => {
  try {
    const { company, title, description, location, jobType, ctc, deadline, minCgpa } = req.body;

    if (!company || !title || !description || !location || !jobType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Update job fields
    job.company = company;
    job.title = title;
    job.description = description;
    job.location = location;
    job.jobType = jobType;
    job.ctc = ctc;
    job.deadline = deadline;
    if (minCgpa !== undefined) job.minCgpa = Number(minCgpa) || 0;
    job.updatedAt = new Date();

    await job.save();

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });

  } catch (error) {
    logger.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating job'
    });
  }
};

export { createJob, getJobs, getJob, updateJob };
