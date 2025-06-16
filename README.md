# Job Board Application

A comprehensive job board platform built with Cloudflare Workers, featuring AI-powered search, enterprise support, and advanced analytics.

## Features

### Core Job Board
- **Job Listings**: Browse and search job postings with advanced filtering
- **Job Details**: Detailed job pages with company information
- **Application System**: Apply to jobs with resume and cover letter
- **Email Notifications**: Automated emails for applications and status updates

### Advanced Search & AI
- **AI-Powered Search**: Semantic job matching using natural language
- **Smart Recommendations**: Personalized job suggestions based on user profile
- **Skill Synonyms**: Understands related skills (e.g., "JS" matches "JavaScript")
- **Location Intelligence**: Recognizes location aliases and remote options

### Application Management
- **AI Scoring System**: Automatically scores and ranks applications
- **Bulk Operations**: Process multiple applications at once
- **Application Analytics**: Track application metrics and conversion rates
- **Customizable Scoring**: Configure scoring weights for different criteria

### Enterprise Features
- **Multi-Company Support**: Manage multiple companies under one organization
- **Role-Based Access**: Different permission levels for team members
- **Team Collaboration**: Invite users and assign roles
- **Activity Tracking**: Monitor all organization activities

### Company Profiles
- **Public Profiles**: Showcase company culture, benefits, and values
- **Company Pages**: Dedicated pages for each company
- **Job Listings by Company**: View all jobs from a specific company
- **Rich Media**: Support for photos, videos, and social links

### Analytics Dashboard
- **Real-Time Metrics**: Track jobs, applications, and performance
- **Conversion Tracking**: Monitor application-to-hire rates
- **Performance Insights**: Identify top-performing jobs
- **Export Capabilities**: Download data for further analysis

### Job Management
- **Bulk Operations**: Activate, deactivate, or extend multiple jobs
- **Auto-Renewal**: Automatically renew high-performing jobs
- **Smart Recommendations**: Get suggestions to improve job performance
- **Expiration Management**: Track and manage job expiration dates

## Pages

### Public Pages
- `index.html` - Main job listings page with AI search
- `companies.html` - Browse all companies
- `company-profile.html` - Individual company profiles
- `job-details.html` - Detailed job information
- `auth.html` - Login/Register page

### Dashboard Pages
- `dashboard.html` - Employer dashboard
- `analytics.html` - Advanced analytics dashboard
- `applications-manager.html` - AI-powered application management
- `enterprise-dashboard.html` - Enterprise organization management

## API Endpoints

### Jobs
- `GET /api/jobs` - List all active jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `POST /api/jobs/bulk` - Bulk job operations

### Applications
- `GET /api/applications` - List applications
- `POST /api/applications` - Submit application
- `PUT /api/applications/:id/status` - Update application status
- `GET /api/applications/:id/score` - Get AI score
- `POST /api/applications/batch-score` - Batch score applications

### Companies
- `GET /api/companies` - List public companies
- `GET /api/companies/:id` - Get company profile
- `GET /api/companies/:id/jobs` - Get company jobs
- `PUT /api/companies/:id/profile` - Update company profile

### Search & AI
- `GET /api/search/jobs` - Advanced job search
- `GET /api/search/suggestions` - Search suggestions
- `POST /api/recommendations` - Get job recommendations
- `POST /api/search/intelligent` - AI-powered search

### Enterprise
- `POST /api/enterprise/organizations` - Create organization
- `GET /api/enterprise/organizations/:id` - Get organization
- `POST /api/enterprise/organizations/:id/companies` - Add company
- `POST /api/enterprise/organizations/:id/users` - Invite user
- `GET /api/enterprise/organizations/:id/dashboard` - Dashboard data

### Analytics
- `GET /api/jobs/:id/rankings` - Get application rankings
- `GET /api/jobs/:id/analytics` - Get job analytics
- `GET /api/renewals/status` - Get renewal status
- `POST /api/renewals/process` - Process auto-renewals

## Setup

1. Clone the repository
2. Install Wrangler CLI: `npm install -g wrangler`
3. Configure your KV namespaces in `wrangler.toml`
4. Deploy with: `wrangler publish`

## Environment Configuration

Update `wrangler.toml` with your KV namespace IDs:

```toml
[[kv_namespaces]]
binding = "JOBS"
id = "your-jobs-namespace-id"

[[kv_namespaces]]
binding = "APPLICATIONS"
id = "your-applications-namespace-id"

# ... other namespaces
```

## Technologies Used

- **Backend**: Cloudflare Workers (Serverless)
- **Storage**: Cloudflare KV (Key-Value store)
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **AI Features**: Custom scoring algorithms
- **Email**: Integrated email service

## Security Features

- JWT-based authentication
- Role-based access control
- Secure password hashing
- CORS protection
- Input validation

## Performance Optimizations

- Efficient KV operations
- Caching strategies
- Lazy loading
- Pagination
- Bulk operations

## Future Enhancements

- Real-time notifications
- Video interviews
- Advanced analytics
- Mobile app
- API rate limiting
- Webhook integrations

## License

This project is proprietary software. All rights reserved.