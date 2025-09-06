import Job from '../models/Job.js';
import { createPaginationResponse } from '../utils/helpers.js';
import logger from '../utils/logger.js';

// @desc    Create a new internal job posting
// @route   POST /api/jobs
// @access  Private (Placement Officer/Admin)
const createJob = async (req, res) => {
  try {
    const { company, title, description, location, jobType, ctc, deadline } = req.body

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

    const skip = (page - 1) * limit;
    
    const jobs = await Job.find(query)
      .populate('company', 'name companyDetails.companyName companyDetails.industry')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

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
    const { company, title, description, location, jobType, ctc, deadline } = req.body;

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
