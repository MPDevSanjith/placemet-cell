// ==========================
// email/emailTemplates.js
// ==========================

// Professional Email Templates for Placement ERP System
// Powered by Eloix Technologies Pvt Ltd
// Maintained by Datzon

const emailTemplates = {
  // Welcome email for new students
  welcomeStudent: (name, email, password) => ({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to Placement ERP - Your Login Credentials | Eloix Technologies',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Placement ERP - Eloix Technologies</title>
          <style>
              @media only screen and (max-width: 600px) {
                  .container { width: 100% !important; margin: 0 !important; }
                  .header { padding: 20px 15px !important; }
                  .content { padding: 30px 20px !important; }
                  .title { font-size: 24px !important; }
                  .subtitle { font-size: 16px !important; }
                  .card { padding: 20px !important; }
                  .button { padding: 12px 24px !important; font-size: 14px !important; }
                  .footer { padding: 20px !important; }
              }
          </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
          <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">
              
              <!-- Header -->
              <div class="header" style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); padding: 40px 30px; text-align: center; position: relative;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #f59e0b, #10b981, #8b5cf6);"></div>
                  <div style="background-color: rgba(255, 255, 255, 0.15); padding: 25px; border-radius: 12px; backdrop-filter: blur(10px);">
                      <h1 class="title" style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Welcome to Placement ERP</h1>
                      <p class="subtitle" style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.95; font-weight: 400;">Your Gateway to Career Success</p>
                  </div>
              </div>
              
              <!-- Content -->
              <div class="content" style="padding: 40px 30px;">
                  <div style="text-align: center; margin-bottom: 25px;">
                      <h2 style="color: #1f2937; margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Hello ${name}!</h2>
                      <p style="color: #6b7280; font-size: 16px; margin: 0;">Welcome to our comprehensive placement management system</p>
                  </div>
                  
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0; text-align: center;">
                      Your account has been successfully created and you can now access all the features designed to enhance your career prospects and streamline your placement journey.
                  </p>
                  
                  <!-- Login Credentials Card -->
                  <div class="card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 30px 0; position: relative;">
                      <div style="background-color: #2563eb; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; margin-bottom: 20px;">🔐 Login Credentials</div>
                      <div>
                          <div style="background-color: #ffffff; border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; margin-bottom: 12px;">
                              <p style="color: #6b7280; font-size: 13px; margin: 0 0 5px 0; font-weight: 500;">Email Address</p>
                              <p style="color: #1f2937; font-size: 15px; margin: 0; font-weight: 600; font-family: 'Courier New', monospace; word-break: break-all;">${email}</p>
                          </div>
                          <div style="background-color: #ffffff; border: 1px solid #d1d5db; border-radius: 6px; padding: 15px;">
                              <p style="color: #6b7280; font-size: 13px; margin: 0 0 5px 0; font-weight: 500;">Temporary Password</p>
                              <p style="color: #1f2937; font-size: 15px; margin: 0; font-weight: 600; font-family: 'Courier New', monospace;">${password}</p>
                          </div>
                      </div>
                  </div>
                  
                  <!-- Features Card -->
                  <div class="card" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 25px; margin: 30px 0;">
                      <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 18px; font-weight: 600; text-align: center;">🚀 What You Can Do</h3>
                      <div style="display: block;">
                          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                              <div style="width: 6px; height: 6px; background-color: #10b981; border-radius: 50%;"></div>
                              <span style="color: #166534; font-size: 14px; font-weight: 500;">Complete your profile</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                              <div style="width: 6px; height: 6px; background-color: #10b981; border-radius: 50%;"></div>
                              <span style="color: #166534; font-size: 14px; font-weight: 500;">ATS resume analysis</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                              <div style="width: 6px; height: 6px; background-color: #10b981; border-radius: 50%;"></div>
                              <span style="color: #166534; font-size: 14px; font-weight: 500;">Apply to job opportunities</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                              <div style="width: 6px; height: 6px; background-color: #10b981; border-radius: 50%;"></div>
                              <span style="color: #166534; font-size: 14px; font-weight: 500;">Track applications</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                              <div style="width: 6px; height: 6px; background-color: #10b981; border-radius: 50%;"></div>
                              <span style="color: #166534; font-size: 14px; font-weight: 500;">Career resources</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px;">
                              <div style="width: 6px; height: 6px; background-color: #10b981; border-radius: 50%;"></div>
                              <span style="color: #166534; font-size: 14px; font-weight: 500;">Real-time notifications</span>
                          </div>
                      </div>
                  </div>
                  
                  <!-- Security Notice -->
                  <div class="card" style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                          <div style="width: 16px; height: 16px; background-color: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                              <span style="color: white; font-size: 10px; font-weight: bold;">!</span>
                          </div>
                          <h4 style="color: #92400e; margin: 0; font-size: 15px; font-weight: 600;">Security Notice</h4>
                      </div>
                      <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                          Please change your password after your first login for security purposes. Keep your login credentials confidential and never share them with anyone.
                      </p>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.FRONTEND_URL || 'https://beyondcampusx.com'}/login" 
                         class="button" style="background: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 15px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
                          🚀 Get Started Now
                      </a>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0; text-align: center;">
                      If you have any questions or need assistance, please contact your placement officer or our support team.
                  </p>
              </div>
              
              <!-- Footer -->
              <div class="footer" style="background: #1f2937; padding: 25px; text-align: center;">
                  <div style="margin-bottom: 15px;">
                      <h3 style="color: #ffffff; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Eloix Technologies Pvt Ltd</h3>
                      <p style="color: #d1d5db; font-size: 13px; margin: 0;">Empowering Education Through Technology</p>
                  </div>
                  <div style="border-top: 1px solid #374151; padding-top: 15px;">
                      <p style="color: #9ca3af; font-size: 11px; margin: 0 0 8px 0;">
                          © ${new Date().getFullYear()} Eloix Technologies Pvt Ltd. All rights reserved.
                      </p>
                      <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                          System maintained by <strong style="color: #60a5fa;">Datzon</strong> | Powered by Advanced Placement Management Technology
                      </p>
                  </div>
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
    subject: 'Login OTP - Placement ERP | Eloix Technologies',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Login OTP - Eloix Technologies</title>
          <style>
              @media only screen and (max-width: 600px) {
                  .container { width: 100% !important; margin: 0 !important; }
                  .header { padding: 20px 15px !important; }
                  .content { padding: 30px 20px !important; }
                  .title { font-size: 24px !important; }
                  .subtitle { font-size: 16px !important; }
                  .card { padding: 20px !important; }
                  .otp-code { font-size: 28px !important; letter-spacing: 8px !important; }
                  .footer { padding: 20px !important; }
              }
          </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
          <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">
              
              <!-- Header -->
              <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 30px; text-align: center; position: relative;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #f59e0b, #10b981, #8b5cf6);"></div>
                  <div style="background-color: rgba(255, 255, 255, 0.15); padding: 25px; border-radius: 12px; backdrop-filter: blur(10px);">
                      <h1 class="title" style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">🔐 Login OTP</h1>
                      <p class="subtitle" style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.95; font-weight: 400;">Your One-Time Password</p>
                  </div>
              </div>
              
              <!-- Content -->
              <div class="content" style="padding: 40px 30px;">
                  <div style="text-align: center; margin-bottom: 25px;">
                      <h2 style="color: #1f2937; margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Hello ${name}!</h2>
                      <p style="color: #6b7280; font-size: 16px; margin: 0;">Secure access to your account</p>
                  </div>
                  
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0; text-align: center;">
                      You have requested to login to your Placement ERP account. Please use the following OTP to complete your secure login process.
                  </p>
                  
                  <!-- OTP Card -->
                  <div class="card" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center; position: relative;">
                      <div style="background-color: #dc2626; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; margin-bottom: 20px;">🔑 Your OTP Code</div>
                      
                      <div>
                          <div style="background-color: #ffffff; border: 2px solid #dc2626; border-radius: 8px; padding: 25px; display: inline-block; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);">
                              <span class="otp-code" style="font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 10px; font-family: 'Courier New', monospace;">${otp}</span>
                          </div>
                      </div>
                      
                      <div style="margin-top: 20px;">
                          <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: 600;">⏰ Valid for 10 minutes only</p>
                      </div>
                  </div>
                  
                  <!-- Security Notice -->
                  <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                          <div style="width: 20px; height: 20px; background-color: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                              <span style="color: white; font-size: 12px; font-weight: bold;">!</span>
                          </div>
                          <h4 style="color: #92400e; margin: 0; font-size: 16px; font-weight: 600;">Security Notice</h4>
                      </div>
                      <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                          This OTP is valid for 10 minutes only. Do not share this OTP with anyone. If you didn't request this OTP, please ignore this email or contact support immediately.
                      </p>
                  </div>
                  
                  <!-- Additional Security Info -->
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h4 style="color: #0c4a6e; margin: 0 0 15px 0; font-size: 16px; font-weight: 600; text-align: center;">🛡️ Security Tips</h4>
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                          <div style="display: flex; align-items: center; gap: 8px;">
                              <div style="width: 6px; height: 6px; background-color: #0ea5e9; border-radius: 50%;"></div>
                              <span style="color: #0c4a6e; font-size: 13px;">Never share your OTP</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px;">
                              <div style="width: 6px; height: 6px; background-color: #0ea5e9; border-radius: 50%;"></div>
                              <span style="color: #0c4a6e; font-size: 13px;">Use on trusted devices only</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px;">
                              <div style="width: 6px; height: 6px; background-color: #0ea5e9; border-radius: 50%;"></div>
                              <span style="color: #0c4a6e; font-size: 13px;">Enter OTP immediately</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px;">
                              <div style="width: 6px; height: 6px; background-color: #0ea5e9; border-radius: 50%;"></div>
                              <span style="color: #0c4a6e; font-size: 13px;">Report suspicious activity</span>
                          </div>
                      </div>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                      If you have any concerns about this login attempt, please contact our support team immediately.
                  </p>
              </div>
              
              <!-- Footer -->
              <div class="footer" style="background: #1f2937; padding: 25px; text-align: center;">
                  <div style="margin-bottom: 15px;">
                      <h3 style="color: #ffffff; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Eloix Technologies Pvt Ltd</h3>
                      <p style="color: #d1d5db; font-size: 13px; margin: 0;">Empowering Education Through Technology</p>
                  </div>
                  <div style="border-top: 1px solid #374151; padding-top: 15px;">
                      <p style="color: #9ca3af; font-size: 11px; margin: 0 0 8px 0;">
                          © ${new Date().getFullYear()} Eloix Technologies Pvt Ltd. All rights reserved.
                      </p>
                      <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                          System maintained by <strong style="color: #60a5fa;">Datzon</strong> | Powered by Advanced Placement Management Technology
                      </p>
                  </div>
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
    subject: 'Password Reset - Placement ERP | Eloix Technologies',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - Eloix Technologies</title>
          <style>
              @media only screen and (max-width: 600px) {
                  .container { width: 100% !important; margin: 0 !important; }
                  .header { padding: 20px 15px !important; }
                  .content { padding: 30px 20px !important; }
                  .title { font-size: 24px !important; }
                  .subtitle { font-size: 16px !important; }
                  .card { padding: 20px !important; }
                  .button { padding: 12px 24px !important; font-size: 14px !important; }
                  .footer { padding: 20px !important; }
              }
          </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
          <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">
              
              <!-- Header -->
              <div class="header" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 30px; text-align: center; position: relative;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #f59e0b, #10b981, #8b5cf6);"></div>
                  <div style="background-color: rgba(255, 255, 255, 0.15); padding: 25px; border-radius: 12px; backdrop-filter: blur(10px);">
                      <h1 class="title" style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">🔑 Password Reset</h1>
                      <p class="subtitle" style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.95; font-weight: 400;">Secure Your Account</p>
                  </div>
              </div>
              
              <!-- Content -->
              <div class="content" style="padding: 40px 30px;">
                  <div style="text-align: center; margin-bottom: 25px;">
                      <h2 style="color: #1f2937; margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Hello ${name}!</h2>
                      <p style="color: #6b7280; font-size: 16px; margin: 0;">Reset your account password securely</p>
                  </div>
                  
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0; text-align: center;">
                      You have requested to reset your password for your Placement ERP account. Click the button below to securely reset your password and regain access to your account.
                  </p>
                  
                  <!-- Reset Button Card -->
                  <div class="card" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center; position: relative;">
                      <div style="background-color: #059669; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; margin-bottom: 20px;">🔐 Secure Reset</div>
                      
                      <div>
                          <a href="${resetUrl}" 
                             class="button" style="background: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 15px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);">
                              🔑 Reset My Password
                          </a>
                      </div>
                      
                      <div style="margin-top: 20px;">
                          <p style="color: #065f46; font-size: 14px; margin: 0; font-weight: 600;">⏰ Link valid for 1 hour only</p>
                      </div>
                  </div>
                  
                  <!-- Security Notice -->
                  <div class="card" style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                          <div style="width: 16px; height: 16px; background-color: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                              <span style="color: white; font-size: 10px; font-weight: bold;">!</span>
                          </div>
                          <h4 style="color: #92400e; margin: 0; font-size: 15px; font-weight: 600;">Security Notice</h4>
                      </div>
                      <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                          This link is valid for 1 hour only. If you didn't request this password reset, please ignore this email and contact support if you suspect unauthorized access to your account.
                      </p>
                  </div>
                  
                  <!-- Alternative Link -->
                  <div class="card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
                      <h4 style="color: #374151; margin: 0 0 12px 0; font-size: 15px; font-weight: 600; text-align: center;">🔗 Alternative Access</h4>
                      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-align: center;">If the button doesn't work, copy and paste this link into your browser:</p>
                      <div style="background-color: #ffffff; border: 1px solid #d1d5db; border-radius: 6px; padding: 12px; word-break: break-all;">
                          <p style="color: #1f2937; font-size: 12px; margin: 0; font-family: 'Courier New', monospace;">${resetUrl}</p>
                      </div>
                  </div>
                  
                  <!-- Password Tips -->
                  <div class="card" style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 25px 0;">
                      <h4 style="color: #0c4a6e; margin: 0 0 12px 0; font-size: 15px; font-weight: 600; text-align: center;">💡 Password Security Tips</h4>
                      <div style="display: block;">
                          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                              <div style="width: 6px; height: 6px; background-color: #0ea5e9; border-radius: 50%;"></div>
                              <span style="color: #0c4a6e; font-size: 13px;">Use at least 8 characters</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                              <div style="width: 6px; height: 6px; background-color: #0ea5e9; border-radius: 50%;"></div>
                              <span style="color: #0c4a6e; font-size: 13px;">Include numbers and symbols</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                              <div style="width: 6px; height: 6px; background-color: #0ea5e9; border-radius: 50%;"></div>
                              <span style="color: #0c4a6e; font-size: 13px;">Avoid personal information</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px;">
                              <div style="width: 6px; height: 6px; background-color: #0ea5e9; border-radius: 50%;"></div>
                              <span style="color: #0c4a6e; font-size: 13px;">Don't reuse old passwords</span>
                          </div>
                      </div>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0; text-align: center;">
                      If you have any questions or need assistance, please contact our support team.
                  </p>
              </div>
              
              <!-- Footer -->
              <div class="footer" style="background: #1f2937; padding: 25px; text-align: center;">
                  <div style="margin-bottom: 15px;">
                      <h3 style="color: #ffffff; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Eloix Technologies Pvt Ltd</h3>
                      <p style="color: #d1d5db; font-size: 13px; margin: 0;">Empowering Education Through Technology</p>
                  </div>
                  <div style="border-top: 1px solid #374151; padding-top: 15px;">
                      <p style="color: #9ca3af; font-size: 11px; margin: 0 0 8px 0;">
                          © ${new Date().getFullYear()} Eloix Technologies Pvt Ltd. All rights reserved.
                      </p>
                      <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                          System maintained by <strong style="color: #60a5fa;">Datzon</strong> | Powered by Advanced Placement Management Technology
                      </p>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `
  })
};

export default emailTemplates;
