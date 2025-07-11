const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('.'));

// Routes for each demo page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint to verify this is vanilla demos
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'locumtruerate-vanilla-demos',
    version: '4.2.1',
    timestamp: new Date().toISOString(),
    message: 'This is the REAL vanilla demos server!',
    deployment: {
      method: process.env.HEROKU_SLUG_COMMIT ? 'github-actions' : 'manual',
      commit: process.env.HEROKU_SLUG_COMMIT || 'unknown',
      dyno: process.env.DYNO || 'local'
    }
  });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

app.get('/calculator', (req, res) => {
  res.sendFile(path.join(__dirname, 'contract-calculator.html'));
});

app.get('/jobs', (req, res) => {
  res.sendFile(path.join(__dirname, 'job-board.html'));
});

app.get('/locum', (req, res) => {
  res.sendFile(path.join(__dirname, 'locum-dashboard.html'));
});

app.get('/paycheck', (req, res) => {
  res.sendFile(path.join(__dirname, 'paycheck-calculator.html'));
});

app.get('/recruiter', (req, res) => {
  res.sendFile(path.join(__dirname, 'recruiter-dashboard.html'));
});

app.listen(PORT, () => {
  console.log(`LocumTrueRate Vanilla Demos running on port ${PORT}`);
  console.log(`🎉 VERCEL DISABLED - This is HEROKU deployment!`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Available pages:`);
  console.log(`  / - Homepage`);
  console.log(`  /admin - Admin Dashboard`);
  console.log(`  /calculator - Contract Calculator`);
  console.log(`  /jobs - Job Board`);
  console.log(`  /locum - Locum Dashboard`);
  console.log(`  /paycheck - Paycheck Calculator`);
  console.log(`  /recruiter - Recruiter Dashboard`);
});