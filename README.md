# Job Board Application

A modern job board application built with Cloudflare Workers and Node.js.

## Features

- Job listing management
- Real-time updates
- Cloudflare Workers integration
- API-driven architecture

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
- Copy `.env.example` to `.env`
- Add your Cloudflare API token

3. Run development server:
```bash
npm run dev
```

## Architecture

- **Frontend**: Modern web interface
- **Backend**: Cloudflare Workers for serverless deployment
- **Database**: Cloudflare KV for data storage
- **API**: RESTful API design

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy
```

## License

MIT