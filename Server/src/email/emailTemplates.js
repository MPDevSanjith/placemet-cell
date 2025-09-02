// ==========================
// email/emailTemplates.js
// ==========================

// Email templates for the Placement ERP system
const emailTemplates = {
  // Welcome email for new students
  welcomeStudent: (name, email, password) => ({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to Placement ERP - Your Login Credentials',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Placement ERP</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🎓 Welcome to Placement ERP</h1>
                  <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your gateway to career success</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hello ${name}!</h2>
                  
                  <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Welcome to the Placement ERP system! Your account has been successfully created and you can now access all the features to enhance your career prospects.
                  </p>
                  
                  <div style="background-color: #f8f9fa; border-left: 4px solid #dc2743; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">🔐 Your Login Credentials</h3>
                      <p style="color: #555555; font-size: 14px; margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
                      <p style="color: #555555; font-size: 14px; margin: 0;"><strong>Password:</strong> ${password}</p>
                  </div>
                  
                  <div style="background-color: #e8f5e8; border: 1px solid #4caf50; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h3 style="color: #2e7d32; margin: 0 0 15px 0; font-size: 18px;">🚀 What You Can Do</h3>
                      <ul style="color: #2e7d32; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                          <li>Complete your profile with skills and experience</li>
                          <li>Upload and analyze your resume with ATS scoring</li>
                          <li>Apply to job opportunities and placement drives</li>
                          <li>Track your application status</li>
                          <li>Access career resources and guidance</li>
                      </ul>
                  </div>
                  
                  <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      <strong>Important:</strong> Please change your password after your first login for security purposes.
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
                         style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block; font-size: 16px;">
                          🚀 Get Started Now
                      </a>
                  </div>
                  
                  <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                      If you have any questions, please contact your placement officer or the system administrator.
                  </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="color: #777777; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} Placement ERP System. All rights reserved.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `
  }),

  // Login OTP email
  loginOtp: (name, email, otp) => ({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Login OTP - Placement ERP',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Login OTP</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🔐 Login OTP</h1>
                  <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your one-time password</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hello ${name}!</h2>
                  
                  <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      You have requested to login to your Placement ERP account. Please use the following OTP to complete your login:
                  </p>
                  
                  <div style="background-color: #f8f9fa; border: 2px solid #dc2743; padding: 30px; margin: 30px 0; border-radius: 8px; text-align: center;">
                      <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">Your OTP Code</h3>
                      <div style="background-color: #ffffff; border: 1px solid #dc2743; padding: 20px; border-radius: 8px; display: inline-block;">
                          <span style="font-size: 32px; font-weight: bold; color: #dc2743; letter-spacing: 8px;">${otp}</span>
                      </div>
                  </div>
                  
                  <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      <strong>Important:</strong> This OTP is valid for 10 minutes only. Do not share this OTP with anyone.
                  </p>
                  
                  <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                      If you didn't request this OTP, please ignore this email or contact support immediately.
                  </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="color: #777777; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} Placement ERP System. All rights reserved.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `
  }),

  // Password reset email
  passwordReset: (name, email, resetUrl) => ({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset - Placement ERP',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🔑 Password Reset</h1>
                  <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Reset your account password</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hello ${name}!</h2>
                  
                  <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      You have requested to reset your password for your Placement ERP account. Click the button below to reset your password:
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                      <a href="${resetUrl}" 
                         style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block; font-size: 16px;">
                          🔑 Reset Password
                      </a>
                  </div>
                  
                  <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      <strong>Important:</strong> This link is valid for 1 hour only. If you didn't request this password reset, please ignore this email.
                  </p>
                  
                  <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                      If the button doesn't work, copy and paste this link into your browser: ${resetUrl}
                  </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="color: #777777; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} Placement ERP System. All rights reserved.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `
  })
};

export default emailTemplates;
