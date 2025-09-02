// ==========================
// email/email.js
// ==========================
import nodemailer from 'nodemailer';
import emailTemplates from './emailTemplates.js';
import logger from '../utils/logger.js';

// Email configuration
let transporter = null;

// Initialize email transporter
const initializeEmail = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    logger.success('Email transporter initialized');
  } else {
    logger.warn('Email credentials not configured. Email functionality will be disabled.');
  }
};

// Get email transporter
const getTransporter = () => transporter;

// Check if email is configured
const isEmailConfigured = () => !!transporter;

// Send email with error handling
const sendEmail = async (mailOptions) => {
  try {
    if (!transporter) {
      logger.info(`Email skipped (transporter not configured)`);
      return { success: true, skipped: true };
    }

    const result = await transporter.sendMail(mailOptions);
    logger.success(`Email sent successfully to ${mailOptions.to}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    logger.error('Email sending error:', error.message);
    return { success: false, error: error.message };
  }
};

export {
  initializeEmail,
  getTransporter,
  isEmailConfigured,
  sendEmail,
  emailTemplates
}; 
