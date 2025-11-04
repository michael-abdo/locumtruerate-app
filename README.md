# LocumTrueRate - Locum Tenens Job Board Platform

## Project Overview
A comprehensive job board platform for locum tenens physicians, featuring multiple dashboard interfaces, calculators, and a full-featured API backend.

## Directory Structure

```
.
├── public/                  # Frontend HTML files
│   ├── index.html          # Landing page
│   ├── job-board.html      # Job listings interface
│   ├── admin-dashboard.html        # Admin control panel
│   ├── locum-dashboard.html        # Physician dashboard
│   ├── recruiter-dashboard.html    # Recruiter interface
│   ├── contract-calculator.html    # Contract rate calculator
│   ├── paycheck-calculator.html    # Paycheck calculator
│   ├── login.html          # Authentication pages
│   └── ...
├── js/                     # Frontend JavaScript modules
│   ├── auth.js             # Authentication logic
│   └── contract-calculator.js      # Calculator logic
├── src/                    # Backend API source code
│   ├── server.js           # Express server entry point
│   ├── routes/             # API route handlers
│   ├── models/             # Database models
│   ├── middleware/         # Express middleware
│   └── db/                 # Database configuration
├── docs/                   # Documentation
│   ├── API_DOCUMENTATION.md        # API endpoint docs
│   ├── BACKEND_SETUP.md            # Setup instructions
│   ├── screenshots/        # UI screenshots
│   └── ...
├── tests/                  # Test files
│   ├── comprehensive-test-runner.js  # Test suite
│   └── demos/              # HTML test demos
├── scripts/                # Utility scripts
│   ├── deploy.sh           # Deployment script
│   └── ...
├── postman/                # API testing
│   ├── LocumCalc_API_Collection.json
│   └── LocumCalc_Environment.json
├── qa/                     # QA test scripts
│   └── ux-tests/           # User experience tests
└── logs/                   # Application logs
```

## Technology Stack

### Frontend
- **Framework**: Pure HTML/CSS/JavaScript (no dependencies)
- **Styling**: CSS Grid, Flexbox
- **State Management**: LocalStorage for client-side persistence

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **API**: RESTful with comprehensive endpoints

## Features

### For Locum Physicians
- Browse and search job listings
- Apply to positions
- Track application status
- Calculate contract rates
- Estimate take-home pay

### For Recruiters
- Post job listings
- Manage applications
- Review candidate profiles
- Track hiring metrics

### For Administrators
- User management
- Platform analytics
- System configuration

## API Overview
The backend provides a comprehensive RESTful API with:
- **Authentication**: JWT-based auth with register/login/logout
- **Jobs**: CRUD operations with advanced filtering
- **Applications**: Full application lifecycle management
- **Calculators**: Contract and paycheck calculation endpoints
- **GDPR Compliance**: Data export and privacy controls

See `docs/API_DOCUMENTATION.md` for complete API reference.

## Getting Started

### Prerequisites
- Node.js 14+
- PostgreSQL 12+

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Initialize database: `node src/db/init.js`
5. Start server: `npm start` (or `npm run dev` for development)

### Testing
- Run API tests: `npm test`
- Use Postman collection in `postman/` for manual testing
- QA test scripts available in `qa/ux-tests/`

## Deployment
The project includes deployment scripts for staging and production environments.
See `docs/DEPLOYMENT.md` for detailed instructions.

## License
This project is proprietary software. All rights reserved.