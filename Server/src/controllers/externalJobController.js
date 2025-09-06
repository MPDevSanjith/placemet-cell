import ExternalJob from '../models/ExternalJob.js';
import { validateObjectId } from '../utils/validation.js';

// @desc    Create a new external job
// @route   POST /api/external-jobs
// @access  Private (Placement Officer only)
const createExternalJob = async (req, res) => {
  try {
    const {
      companyName,
      jobTitle,
      description,
      location,
      jobType,
      externalUrl,
      salary,
      requirements,
      tags,
      applicationDeadline
    } = req.body;

    // Create new external job
    const externalJob = new ExternalJob({
      companyName,
      jobTitle,
      description,
      location,
      jobType,
      externalUrl,
      salary,
      requirements,
      tags,
      applicationDeadline,
      postedBy: req.user.id // From auth middleware
    });

    const savedJob = await externalJob.save();

    res.status(201).json({
      success: true,
      message: 'External job created successfully',
      data: savedJob
    });

  } catch (error) {
    console.error('Error creating external job:', error);
    if (error.code === 11000 && error.keyPattern && error.keyPattern.externalUrl) {
      return res.status(409).json({
        success: false,
        message: 'An external job with this URL already exists',
        field: 'externalUrl'
      });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Get all external jobs with filtering and pagination
// @route   GET /api/external-jobs
// @access  Public
const getAllExternalJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      jobType,
      location,
      company,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (jobType) filter.jobType = jobType;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (company) filter.companyName = { $regex: company, $options: 'i' };
    
    // Search functionality
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const jobs = await ExternalJob.find(filter)
      .populate('postedBy', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await ExternalJob.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Error fetching external jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Get external job by ID
// @route   GET /api/external-jobs/:id
// @access  Public
const getExternalJobById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    const job = await ExternalJob.findById(id)
      .populate('postedBy', 'name email role')
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'External job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });

  } catch (error) {
    console.error('Error fetching external job:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Update external job
// @route   PUT /api/external-jobs/:id
// @access  Private (Placement Officer who posted it or Admin)
const updateExternalJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    const job = await ExternalJob.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'External job not found'
      });
    }

    // Check if user is authorized to update this job
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    // Update fields
    const updatedJob = await ExternalJob.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('postedBy', 'name email role');

    res.json({
      success: true,
      message: 'External job updated successfully',
      data: updatedJob
    });

  } catch (error) {
    console.error('Error updating external job:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Delete external job
// @route   DELETE /api/external-jobs/:id
// @access  Private (Placement Officer who posted it or Admin)
const deleteExternalJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    const job = await ExternalJob.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'External job not found'
      });
    }

    // Check if user is authorized to delete this job
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }

    await ExternalJob.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'External job deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting external job:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Update job status
// @route   PATCH /api/external-jobs/:id/status
// @access  Private (Placement Officer who posted it or Admin)
const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    if (!['Active', 'Inactive', 'Expired', 'Filled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const job = await ExternalJob.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'External job not found'
      });
    }

    // Check if user is authorized to update this job
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    job.status = status;
    await job.save();

    res.json({
      success: true,
      message: 'Job status updated successfully',
      data: job
    });

  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Get external jobs statistics
// @route   GET /api/external-jobs/stats/overview
// @access  Private (Placement Officer)
const getExternalJobsStats = async (req, res) => {
  try {
    const stats = await ExternalJob.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalJobs = await ExternalJob.countDocuments();
    const activeJobs = await ExternalJob.countDocuments({ status: 'Active' });
    const expiredJobs = await ExternalJob.countDocuments({ status: 'Expired' });

    // Get jobs by type
    const jobsByType = await ExternalJob.aggregate([
      {
        $group: {
          _id: '$jobType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent jobs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentJobs = await ExternalJob.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        totalJobs,
        activeJobs,
        expiredJobs,
        recentJobs,
        statusBreakdown: stats,
        jobsByType
      }
    });

  } catch (error) {
    console.error('Error fetching external jobs stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Bulk update expired jobs
// @route   POST /api/external-jobs/bulk-update-expired
// @access  Private (Admin only)
const bulkUpdateExpiredJobs = async (req, res) => {
  try {
    const result = await ExternalJob.updateMany(
      {
        status: 'Active',
        applicationDeadline: { $lt: new Date() }
      },
      {
        $set: { status: 'Expired' }
      }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} expired jobs`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error bulk updating expired jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export {
  createExternalJob,
  getAllExternalJobs,
  getExternalJobById,
  updateExternalJob,
  deleteExternalJob,
  updateJobStatus,
  getExternalJobsStats,
  bulkUpdateExpiredJobs
};
