const User = require('../models/User');
const { createPaginationResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const CompanyRequest = require('../models/CompanyRequest');

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private
const getCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const industry = req.query.industry;

    let query = { role: 'company' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'companyDetails.companyName': { $regex: search, $options: 'i' } },
        { 'companyDetails.industry': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (industry) {
      query['companyDetails.industry'] = industry;
    }

    const skip = (page - 1) * limit;
    
    const companies = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ 'companyDetails.companyName': 1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: createPaginationResponse(companies, total, page, limit)
    });

  } catch (error) {
    logger.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching companies'
    });
  }
};

// @desc    Get company profile
// @route   GET /api/companies/:id
// @access  Private
const getCompany = async (req, res) => {
  try {
    const company = await User.findOne({ 
      _id: req.params.id, 
      role: 'company' 
    }).select('-password');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: { company }
    });

  } catch (error) {
    logger.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching company'
    });
  }
};

module.exports = {
  getCompanies,
  getCompany,
  // placeholder export to avoid unused import warnings
};
