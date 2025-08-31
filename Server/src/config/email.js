// ==========================
// config/email.js
// ==========================
const nodemailer = require('nodemailer')

// Email configuration
let transporter = null

// Initialize email transporter
const initializeEmail = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
    console.log('✅ Email transporter initialized')
  } else {
    console.log('⚠️ Email credentials not configured. Email functionality will be disabled.')
  }
}

// Get email transporter
const getTransporter = () => transporter

// Check if email is configured
const isEmailConfigured = () => !!transporter

// Send email with error handling
const sendEmail = async (mailOptions) => {
  try {
    if (!transporter) {
      console.log(`📧 Email skipped (transporter not configured)`)
      return { success: true, skipped: true }
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`📧 Email sent successfully to ${mailOptions.to}`)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('📧 Email sending error:', error.message)
    return { success: false, error: error.message }
  }
}

// Import email templates
const emailTemplates = require('../templates/emailTemplates')

module.exports = {
  initializeEmail,
  getTransporter,
  isEmailConfigured,
  sendEmail,
  emailTemplates
}
