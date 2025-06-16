/**
 * Welcome email template for new user registration
 */

export interface WelcomeEmailData {
  name: string;
  email: string;
  companyName?: string;
  dashboardUrl: string;
  supportUrl: string;
}

export function generateWelcomeEmail(data: WelcomeEmailData): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to LocumTrueRate</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .content {
      background: white;
      padding: 30px 20px;
      border: 1px solid #e1e5e9;
      border-top: none;
    }
    .cta-button {
      display: inline-block;
      background: #007bff;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .features {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .feature {
      margin-bottom: 15px;
    }
    .feature h4 {
      margin: 0 0 5px 0;
      color: #495057;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #6c757d;
      border-radius: 0 0 8px 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">LocumTrueRate</div>
    <p>Welcome to the future of locum tenens!</p>
  </div>
  
  <div class="content">
    <h2>Welcome aboard, ${data.name}! 🎉</h2>
    
    <p>Thank you for joining LocumTrueRate, the premier platform for locum tenens opportunities. We're excited to help ${data.companyName || 'your organization'} find the best healthcare professionals.</p>
    
    <p>Your account has been successfully created with the email: <strong>${data.email}</strong></p>
    
    <div class="features">
      <h3>Here's what you can do now:</h3>
      
      <div class="feature">
        <h4>📋 Post Job Opportunities</h4>
        <p>Create detailed job postings to attract qualified locum tenens professionals</p>
      </div>
      
      <div class="feature">
        <h4>🔍 AI-Powered Matching</h4>
        <p>Our intelligent system matches your requirements with the best candidates</p>
      </div>
      
      <div class="feature">
        <h4>📊 Advanced Analytics</h4>
        <p>Track your posting performance and application metrics</p>
      </div>
      
      <div class="feature">
        <h4>💰 Calculate True Rates</h4>
        <p>Access our industry-leading rate calculators for transparent pricing</p>
      </div>
    </div>
    
    <p>Ready to get started?</p>
    
    <a href="${data.dashboardUrl}" class="cta-button">Access Your Dashboard</a>
    
    <p>If you have any questions or need assistance, our support team is here to help:</p>
    <p><a href="${data.supportUrl}">Contact Support</a> | <a href="mailto:support@locumtruerate.com">support@locumtruerate.com</a></p>
    
    <p>Best regards,<br>The LocumTrueRate Team</p>
  </div>
  
  <div class="footer">
    <p>© 2024 LocumTrueRate. All rights reserved.</p>
    <p>This email was sent to ${data.email}. If you didn't create this account, please ignore this email.</p>
  </div>
</body>
</html>`;

  const text = `
Welcome to LocumTrueRate!

Hi ${data.name},

Thank you for joining LocumTrueRate, the premier platform for locum tenens opportunities. We're excited to help ${data.companyName || 'your organization'} find the best healthcare professionals.

Your account has been successfully created with the email: ${data.email}

Here's what you can do now:

📋 Post Job Opportunities
Create detailed job postings to attract qualified locum tenens professionals

🔍 AI-Powered Matching  
Our intelligent system matches your requirements with the best candidates

📊 Advanced Analytics
Track your posting performance and application metrics

💰 Calculate True Rates
Access our industry-leading rate calculators for transparent pricing

Ready to get started? Access your dashboard: ${data.dashboardUrl}

If you have any questions or need assistance, our support team is here to help:
${data.supportUrl}
support@locumtruerate.com

Best regards,
The LocumTrueRate Team

---
© 2024 LocumTrueRate. All rights reserved.
This email was sent to ${data.email}. If you didn't create this account, please ignore this email.
`;

  return { html, text };
}