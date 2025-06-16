# 🚀 Modern Job Board Application

A complete, production-ready job board built with Cloudflare Workers, featuring advanced search, employer authentication, and real-time application tracking.

## ✨ Features

### 🔍 **Advanced Job Search**
- Real-time search across title, company, description, and tags
- Filter by job type, location, and category
- Search term highlighting
- Smart sorting (newest, oldest, alphabetical)
- Paginated results (10 jobs per page)

### 💼 **Comprehensive Job Management**
- Full CRUD operations for job postings
- 9 predefined categories (Engineering, Design, Marketing, etc.)
- Custom tag system for skills/technologies
- Job expiration tracking
- Rich job descriptions with metadata

### 📋 **Application System**
- Complete application form with validation
- File upload support for resumes (PDF, DOC, DOCX)
- Cover letter and portfolio URL collection
- Application status tracking
- Email and phone contact management

### 👔 **Employer Authentication**
- Secure registration and login system
- Password hashing with SHA-256
- JWT-like token authentication
- Protected employer dashboard
- Session management

### 📊 **Admin Dashboard**
- Overview with key statistics
- Job management interface
- Application review system
- User-friendly job posting workflow
- Real-time data updates

### 🛠 **Technical Excellence**
- **Serverless**: Built on Cloudflare Workers
- **Fast**: Global edge deployment
- **Scalable**: KV storage for data persistence
- **Secure**: CORS support, input validation
- **Mobile-first**: Responsive design
- **Developer-friendly**: Complete API documentation

## 🏗 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Cloudflare      │    │   KV Storage    │
│   (HTML/JS)     │◄──►│   Workers        │◄──►│   (Database)    │
│                 │    │   (API Layer)    │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
   • Job Search UI        • REST API            • Jobs Storage
   • Application Form     • Authentication      • Applications DB
   • Employer Dashboard   • CRUD Operations     • Employer Accounts
   • Responsive Design    • CORS Support        • Session Data
```

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd job-board
npm install
```

### 2. Deploy to Cloudflare
```bash
# Automated deployment with KV namespace setup
npm run deploy

# Or manual deployment
wrangler auth
wrangler publish
```

### 3. Configure KV Namespaces
The deployment script will automatically create and configure:
- `JOBS` - Job postings storage
- `APPLICATIONS` - Application submissions
- `EMPLOYERS` - Employer accounts

### 4. Access Your Job Board
- **Public Job Board**: `https://your-worker.your-subdomain.workers.dev`
- **Employer Login**: `https://your-worker.your-subdomain.workers.dev/auth.html`
- **Admin Dashboard**: `https://your-worker.your-subdomain.workers.dev/dashboard.html`

## 📖 Usage

### For Job Seekers
1. Browse jobs at the main page
2. Use search and filters to find relevant positions
3. Click "Apply Now" on any job
4. Fill out the application form with resume upload
5. Submit and track application status

### For Employers
1. Visit `/auth.html` to register/login
2. Access dashboard at `/dashboard.html`
3. Post jobs through the main interface
4. Review applications in the dashboard
5. Manage job postings and applicants

## 🛠 Development

### Local Development
```bash
# Start local development server
npm run dev

# Open browser to http://localhost:8787
```

### Project Structure
```
├── public/               # Frontend files
│   ├── index.html       # Main job board
│   ├── apply.html       # Application form
│   ├── auth.html        # Employer authentication
│   └── dashboard.html   # Employer dashboard
├── src/                 # Backend API
│   └── index.js         # Cloudflare Worker
├── docs/                # Documentation
│   └── API.md          # Complete API reference
├── wrangler.toml        # Cloudflare configuration
├── deploy.sh           # Automated deployment
└── package.json        # Dependencies and scripts
```

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run deploy   # Deploy with setup script
npm run publish  # Direct Cloudflare deployment
npm run setup    # Run setup script
```

## 🔧 Configuration

### Environment Variables
Create `.env` file:
```env
CLOUDFLARE_API_TOKEN=your-token-here
```

### Wrangler Configuration
Update `wrangler.toml` with your KV namespace IDs:
```toml
[[kv_namespaces]]
binding = "JOBS"
id = "your-jobs-namespace-id"

[[kv_namespaces]]
binding = "APPLICATIONS"
id = "your-applications-namespace-id"

[[kv_namespaces]]
binding = "EMPLOYERS"
id = "your-employers-namespace-id"
```

## 📚 API Documentation

Complete API documentation is available at [`docs/API.md`](./docs/API.md).

### Key Endpoints
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create job posting
- `POST /api/applications` - Submit application
- `POST /api/auth/register` - Employer registration
- `POST /api/auth/login` - Employer login

### Example API Usage
```javascript
// Fetch all jobs
const response = await fetch('/api/jobs');
const jobs = await response.json();

// Submit application
const application = {
  jobId: 'job-uuid',
  fullName: 'John Doe',
  email: 'john@example.com',
  coverLetter: 'I am interested...'
};

await fetch('/api/applications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(application)
});
```

## 🔒 Security Features

- **Password Hashing**: SHA-256 encryption for stored passwords
- **Token Authentication**: JWT-like tokens for session management
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configurable cross-origin resource sharing
- **XSS Prevention**: Input sanitization and output encoding

## 🚀 Production Deployment

### Cloudflare Workers
1. **Sign up** for Cloudflare account
2. **Install** Wrangler CLI: `npm install -g wrangler`
3. **Authenticate**: `wrangler auth`
4. **Deploy**: `npm run deploy`

### Custom Domain (Optional)
1. Add your domain to Cloudflare
2. Configure DNS settings
3. Update `wrangler.toml` with custom domain
4. Redeploy: `wrangler publish`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] Email notifications for applications
- [ ] Advanced analytics dashboard
- [ ] Multi-company support
- [ ] Application status workflow
- [ ] Resume parsing and matching
- [ ] Integration with external job boards
- [ ] Mobile app development

## 💡 Support

- **Documentation**: [API Docs](./docs/API.md)
- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)

---

**Built with ❤️ using Cloudflare Workers**