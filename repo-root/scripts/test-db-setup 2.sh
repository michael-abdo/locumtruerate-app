#!/bin/bash

# Test database setup script
set -e

echo "🚀 Setting up test environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️  docker-compose not found, trying docker compose...${NC}"
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Function to wait for service
wait_for_service() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $service to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if $DOCKER_COMPOSE -f docker-compose.test.yml ps $service | grep -q "healthy\|Up"; then
            echo -e "${GREEN}✅ $service is ready!${NC}"
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts - waiting for $service..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service failed to start within expected time${NC}"
    return 1
}

# Stop existing test containers
echo -e "${YELLOW}🧹 Cleaning up existing test containers...${NC}"
$DOCKER_COMPOSE -f docker-compose.test.yml down --volumes --remove-orphans

# Start test services
echo -e "${YELLOW}🐳 Starting test services...${NC}"
$DOCKER_COMPOSE -f docker-compose.test.yml up -d postgres-test redis-test minio-test mailhog-test

# Wait for core services
wait_for_service postgres-test
wait_for_service redis-test
wait_for_service minio-test
wait_for_service mailhog-test

# Initialize database
echo -e "${YELLOW}🗄️  Initializing test database...${NC}"
$DOCKER_COMPOSE -f docker-compose.test.yml run --rm db-init

# Verify services
echo -e "${YELLOW}🔍 Verifying test services...${NC}"

# Test PostgreSQL connection
if docker exec locumtruerate-postgres-test pg_isready -U postgres -d locumtruerate_test > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is accessible${NC}"
else
    echo -e "${RED}❌ PostgreSQL connection failed${NC}"
    exit 1
fi

# Test Redis connection
if docker exec locumtruerate-redis-test redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is accessible${NC}"
else
    echo -e "${RED}❌ Redis connection failed${NC}"
    exit 1
fi

# Test MinIO connection
if curl -f -s http://localhost:9001/minio/health/live > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MinIO is accessible${NC}"
else
    echo -e "${RED}❌ MinIO connection failed${NC}"
    exit 1
fi

# Test Mailhog connection
if curl -f -s http://localhost:8026 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Mailhog is accessible${NC}"
else
    echo -e "${RED}❌ Mailhog connection failed${NC}"
    exit 1
fi

# Export environment variables for tests
echo -e "${YELLOW}📝 Setting up environment variables...${NC}"
cat > .env.test << EOF
# Test Environment Variables
NODE_ENV=test

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/locumtruerate_test
DATABASE_URL_TEST_1=postgresql://postgres:postgres@localhost:5433/locumtruerate_test_1
DATABASE_URL_TEST_2=postgresql://postgres:postgres@localhost:5433/locumtruerate_test_2
DATABASE_URL_TEST_3=postgresql://postgres:postgres@localhost:5433/locumtruerate_test_3
DATABASE_URL_TEST_4=postgresql://postgres:postgres@localhost:5433/locumtruerate_test_4

# Redis
REDIS_URL=redis://localhost:6380

# MinIO (S3-compatible)
AWS_ACCESS_KEY_ID=testuser
AWS_SECRET_ACCESS_KEY=testpassword
AWS_REGION=us-east-1
S3_ENDPOINT=http://localhost:9001
S3_BUCKET=test-bucket

# Email (Mailhog)
SMTP_HOST=localhost
SMTP_PORT=1026
SMTP_USER=test
SMTP_PASS=test
EMAIL_FROM=test@locumtruerate.com

# Test API Keys (fake values for testing)
STRIPE_SECRET_KEY=sk_test_fake_key_for_testing
STRIPE_PUBLISHABLE_KEY=pk_test_fake_key_for_testing
SENDGRID_API_KEY=SG.fake_key_for_testing
CLERK_SECRET_KEY=sk_test_fake_clerk_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Security
JWT_SECRET=test_jwt_secret_key_for_testing_only
ENCRYPTION_KEY=test_encryption_key_32_chars_long

# Feature Flags
ENABLE_EMAIL_SENDING=false
ENABLE_STRIPE_WEBHOOKS=false
ENABLE_ANALYTICS=false
EOF

echo -e "${GREEN}✨ Test environment setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Available services:${NC}"
echo "  🐘 PostgreSQL: localhost:5433"
echo "  🔴 Redis: localhost:6380" 
echo "  📦 MinIO: http://localhost:9001 (UI: http://localhost:9091)"
echo "  📧 Mailhog: http://localhost:8026"
echo ""
echo -e "${YELLOW}🧪 To run tests:${NC}"
echo "  pnpm test              # Run all tests"
echo "  pnpm test:unit         # Run unit tests"
echo "  pnpm test:integration  # Run integration tests"
echo "  pnpm test:e2e          # Run end-to-end tests"
echo ""
echo -e "${YELLOW}🧹 To cleanup:${NC}"
echo "  $DOCKER_COMPOSE -f docker-compose.test.yml down --volumes"
echo ""
echo -e "${GREEN}🎉 Happy testing!${NC}"