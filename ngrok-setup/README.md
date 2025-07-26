# ngrok Setup for LocumTrueRate API

## Quick Start

1. **Start your API server** (if not already running):
   ```bash
   npm start
   ```

2. **Start ngrok tunnel**:
   ```bash
   ./ngrok-setup/start-ngrok.sh
   ```

3. **Access your API publicly**:
   - Public URL: `https://mike-development.ngrok-free.app`
   - Admin interface: `http://localhost:4040`

## Manual Commands

If you prefer to run ngrok manually:

```bash
# Basic tunnel
ngrok http 4000

# With reserved domain
ngrok http --domain=mike-development.ngrok-free.app 4000
```

## Testing Public API

Once ngrok is running, test your public API:

```bash
# Health check
curl https://mike-development.ngrok-free.app/health

# Get jobs
curl https://mike-development.ngrok-free.app/api/v1/jobs

# Test calculator
curl -X POST https://mike-development.ngrok-free.app/api/v1/calculate/contract \
  -H "Content-Type: application/json" \
  -d '{"hourlyRate":200,"hoursPerWeek":40,"weeksPerYear":48,"state":"CA","expenseRate":0.15}'
```

## Credentials

- **Account**: mike-development.ngrok-free.app
- **Reserved Domain**: mike-development.ngrok-free.app
- **Auth Token**: Configured in `/home/Mike/.config/ngrok/ngrok.yml`

## Files

- `ngrok-credentials.txt` - Full credential details
- `start-ngrok.sh` - Quick start script
- `README.md` - This guide