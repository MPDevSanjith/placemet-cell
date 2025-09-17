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
  if (process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const secure = Number(process.env.EMAIL_PORT) === 465
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure,
      requireTLS: !secure, // STARTTLS on 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        // Hostinger commonly requires modern TLS; don't fail on self-signed
        rejectUnauthorized: false,
        ciphers: 'TLSv1.2'
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 50
    });
    transporter.verify((err, success) => {
      if (err) {
        logger.error('Email transporter verify failed:', err.message)
      } else {
        logger.success('Email transporter ready')
      }
    })
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

    const fromAddress = mailOptions.from || process.env.EMAIL_FROM || process.env.EMAIL_USER
    const finalMail = {
      from: fromAddress,
      replyTo: mailOptions.replyTo || fromAddress,
      ...mailOptions,
    }
    const result = await transporter.sendMail(finalMail);
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
