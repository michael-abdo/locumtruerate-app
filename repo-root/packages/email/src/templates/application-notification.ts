/**
 * Application notification email templates
 */

export interface ApplicationNotificationData {
  employerName: string;
  jobTitle: string;
  jobId: string;
  companyName: string;
  applicantName: string;
  applicantEmail: string;
  applicationDate: string;
  applicationUrl: string;
  score?: number;
  matchPercentage?: number;
}

export interface ApplicationConfirmationData {
  applicantName: string;
  jobTitle: string;
  companyName: string;
  applicationDate: string;
  applicationId: string;
  statusUrl: string;
}

export function generateApplicationNotificationEmail(data: ApplicationNotificationData): { html: string; text: string } {
  const scoreSection = data.score ? `
    <div class="score-section">
      <h3>AI Application Score</h3>
      <div class="score-badge ${data.score >= 80 ? 'high' : data.score >= 60 ? 'medium' : 'low'}">
        ${data.score}/100
      </div>
      ${data.matchPercentage ? `<p>Match Percentage: <strong>${data.matchPercentage}%</strong></p>` : ''}
      <p class="score-explanation">
        ${data.score >= 80 
          ? 'This candidate is an excellent match for your requirements.' 
          : data.score >= 60 
          ? 'This candidate meets most of your requirements.'
          : 'This candidate may need additional review.'}
      </p>
    </div>
  ` : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Application Received</title>
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
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: white;
      padding: 30px 20px;
      border: 1px solid #e1e5e9;
      border-top: none;
    }
    .application-details {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #dee2e6;
    }
    .detail-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    .label {
      font-weight: bold;
      color: #495057;
    }
    .score-section {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
      text-align: center;
    }
    .score-badge {
      display: inline-block;
      padding: 10px 20px;
      border-radius: 25px;
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0;
    }
    .score-badge.high {
      background: #d4edda;
      color: #155724;
      border: 2px solid #c3e6cb;
    }
    .score-badge.medium {
      background: #fff3cd;
      color: #856404;
      border: 2px solid #ffeaa7;
    }
    .score-badge.low {
      background: #f8d7da;
      color: #721c24;
      border: 2px solid #f5c6cb;
    }
    .score-explanation {
      font-style: italic;
      margin-top: 10px;
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
    .urgent {
      background: #dc3545;
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
    <h1>📥 New Application Received</h1>
    <p>Someone has applied for your job posting</p>
  </div>
  
  <div class="content">
    <h2>Hello ${data.employerName},</h2>
    
    <p>Great news! You've received a new application for your job posting.</p>
    
    <div class="application-details">
      <div class="detail-row">
        <span class="label">Job Position:</span>
        <span>${data.jobTitle}</span>
      </div>
      <div class="detail-row">
        <span class="label">Company:</span>
        <span>${data.companyName}</span>
      </div>
      <div class="detail-row">
        <span class="label">Applicant:</span>
        <span>${data.applicantName}</span>
      </div>
      <div class="detail-row">
        <span class="label">Email:</span>
        <span>${data.applicantEmail}</span>
      </div>
      <div class="detail-row">
        <span class="label">Applied:</span>
        <span>${data.applicationDate}</span>
      </div>
    </div>
    
    ${scoreSection}
    
    <p>Don't keep qualified candidates waiting! Review the application and reach out promptly to secure the best talent.</p>
    
    <a href="${data.applicationUrl}" class="cta-button ${data.score && data.score >= 80 ? 'urgent' : ''}">
      Review Application
    </a>
    
    <p><strong>Pro Tip:</strong> Quick responses lead to better candidate conversion rates. Industry data shows that responding within 24 hours increases your chances of securing top talent by 70%.</p>
    
    <p>Best regards,<br>The LocumTrueRate Team</p>
  </div>
  
  <div class="footer">
    <p>© 2024 LocumTrueRate. All rights reserved.</p>
    <p>Manage your notification preferences in your <a href="${data.applicationUrl.split('/applications')[0]}/settings">dashboard settings</a>.</p>
  </div>
</body>
</html>`;

  const text = `
New Application Received - LocumTrueRate

Hello ${data.employerName},

Great news! You've received a new application for your job posting.

Application Details:
- Job Position: ${data.jobTitle}
- Company: ${data.companyName}
- Applicant: ${data.applicantName}
- Email: ${data.applicantEmail}
- Applied: ${data.applicationDate}

${data.score ? `
AI Application Score: ${data.score}/100
${data.matchPercentage ? `Match Percentage: ${data.matchPercentage}%` : ''}

${data.score >= 80 
  ? 'This candidate is an excellent match for your requirements.' 
  : data.score >= 60 
  ? 'This candidate meets most of your requirements.'
  : 'This candidate may need additional review.'}
` : ''}

Don't keep qualified candidates waiting! Review the application and reach out promptly to secure the best talent.

Review Application: ${data.applicationUrl}

Pro Tip: Quick responses lead to better candidate conversion rates. Industry data shows that responding within 24 hours increases your chances of securing top talent by 70%.

Best regards,
The LocumTrueRate Team

---
© 2024 LocumTrueRate. All rights reserved.
`;

  return { html, text };
}

export function generateApplicationConfirmationEmail(data: ApplicationConfirmationData): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Confirmation</title>
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
      background: linear-gradient(135deg, #007bff 0%, #6610f2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: white;
      padding: 30px 20px;
      border: 1px solid #e1e5e9;
      border-top: none;
    }
    .confirmation-box {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
      text-align: center;
    }
    .application-summary {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .next-steps {
      background: #cff4fc;
      border: 1px solid #b6effb;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
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
    <h1>✅ Application Submitted</h1>
    <p>Your application has been successfully received</p>
  </div>
  
  <div class="content">
    <h2>Thank you, ${data.applicantName}!</h2>
    
    <div class="confirmation-box">
      <h3>🎉 Application Confirmed</h3>
      <p>Your application has been successfully submitted and is now being reviewed.</p>
      <p><strong>Application ID:</strong> ${data.applicationId}</p>
    </div>
    
    <div class="application-summary">
      <h3>Application Summary</h3>
      <p><strong>Position:</strong> ${data.jobTitle}</p>
      <p><strong>Company:</strong> ${data.companyName}</p>
      <p><strong>Submitted:</strong> ${data.applicationDate}</p>
    </div>
    
    <div class="next-steps">
      <h3>What happens next?</h3>
      <ol>
        <li><strong>Review Process:</strong> The hiring team will review your application and qualifications</li>
        <li><strong>AI Matching:</strong> Our intelligent system will score your compatibility with the role</li>
        <li><strong>Response:</strong> You'll typically hear back within 2-3 business days</li>
        <li><strong>Next Steps:</strong> If selected, the employer will contact you directly for next steps</li>
      </ol>
    </div>
    
    <p>You can track the status of your application anytime:</p>
    
    <a href="${data.statusUrl}" class="cta-button">Track Application Status</a>
    
    <p><strong>Tips while you wait:</strong></p>
    <ul>
      <li>Keep your phone handy - employers often call quickly for great candidates</li>
      <li>Prepare for potential interview questions about the role</li>
      <li>Research the company and location</li>
      <li>Continue applying to other relevant positions</li>
    </ul>
    
    <p>Good luck! We're rooting for you.</p>
    
    <p>Best regards,<br>The LocumTrueRate Team</p>
  </div>
  
  <div class="footer">
    <p>© 2024 LocumTrueRate. All rights reserved.</p>
    <p>Need help? Contact us at <a href="mailto:support@locumtruerate.com">support@locumtruerate.com</a></p>
  </div>
</body>
</html>`;

  const text = `
Application Confirmation - LocumTrueRate

Thank you, ${data.applicantName}!

✅ APPLICATION CONFIRMED
Your application has been successfully submitted and is now being reviewed.
Application ID: ${data.applicationId}

Application Summary:
- Position: ${data.jobTitle}
- Company: ${data.companyName}
- Submitted: ${data.applicationDate}

What happens next?
1. Review Process: The hiring team will review your application and qualifications
2. AI Matching: Our intelligent system will score your compatibility with the role
3. Response: You'll typically hear back within 2-3 business days
4. Next Steps: If selected, the employer will contact you directly for next steps

Track your application status: ${data.statusUrl}

Tips while you wait:
- Keep your phone handy - employers often call quickly for great candidates
- Prepare for potential interview questions about the role
- Research the company and location
- Continue applying to other relevant positions

Good luck! We're rooting for you.

Best regards,
The LocumTrueRate Team

---
© 2024 LocumTrueRate. All rights reserved.
Need help? Contact us at support@locumtruerate.com
`;

  return { html, text };
}