# ContractCalc Pro - Locum Tenens Job Board Platform

## Project Overview
A vanilla JavaScript job board platform for locum tenens physicians, featuring multiple dashboard interfaces and utility tools.

## Directory Structure

```
.
├── public/                 # Main application HTML files
│   ├── index.html         # Landing page
│   ├── job-board.html     # Job listings interface
│   ├── admin-dashboard.html        # Admin control panel
│   ├── locum-dashboard.html        # Physician dashboard
│   ├── recruiter-dashboard.html    # Recruiter interface
│   ├── contract-calculator.html    # Contract rate calculator
│   ├── paycheck-calculator.html    # Paycheck calculator
│   ├── login.html         # Authentication pages
│   ├── signup.html
│   └── ...
├── js/                    # JavaScript modules
│   ├── auth.js            # Authentication logic
│   ├── bug-reporter.js    # Bug reporting tool
│   └── ...
├── css/                   # Stylesheets
│   └── mobile.css         # Mobile responsive styles
├── docs/                  # Documentation
│   ├── images/            # Screenshots and diagrams
│   └── *.md              # Documentation files
├── qa/                    # QA test files
│   └── ux-tests/          # User experience test scripts
├── scripts/               # Deployment and utility scripts
│   ├── deploy.sh
│   └── ...
├── tests/                 # Test HTML files
│   └── ...
├── src/                   # Backend source code (not used in staging)
├── db/                    # Database files
└── config/                # Configuration files
    └── nginx.conf.erb     # Nginx configuration for Heroku
```

## Technology Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Hosting**: Heroku with nginx buildpack
- **No frameworks**: Pure JavaScript implementation

## Key Features
- Multiple user dashboards (Locum, Recruiter, Admin)
- Job board with search and filtering
- Contract and paycheck calculators
- Demo authentication system
- Bug reporting tool

## Usage
All HTML files in the `public/` directory can be accessed directly. The staging environment uses demo data and does not require backend services.

## Deployment
- **Staging**: Deployed to Heroku at https://locumtruerate-stage-8edec28739b0.herokuapp.com/
- **Buildpack**: Nginx for static site hosting
- **Configuration**: See `Procfile` and `static.json`# Cache bust Mon Sep  8 20:22:50 UTC 2025
