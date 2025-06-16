#!/bin/bash

# Test database teardown script
set -e

echo "🧹 Tearing down test environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️  docker-compose not found, trying docker compose...${NC}"
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Function to check if container exists
container_exists() {
    docker ps -a --format "table {{.Names}}" | grep -q "$1"
}

# Stop and remove test containers
echo -e "${YELLOW}🛑 Stopping test containers...${NC}"
$DOCKER_COMPOSE -f docker-compose.test.yml down --volumes --remove-orphans

# Remove any orphaned containers
echo -e "${YELLOW}🧹 Cleaning up orphaned containers...${NC}"
containers=(
    "locumtruerate-postgres-test"
    "locumtruerate-redis-test"
    "locumtruerate-minio-test"
    "locumtruerate-mailhog-test"
    "locumtruerate-db-init"
)

for container in "${containers[@]}"; do
    if container_exists "$container"; then
        echo "Removing container: $container"
        docker rm -f "$container" 2>/dev/null || true
    fi
done

# Remove test volumes
echo -e "${YELLOW}💾 Removing test volumes...${NC}"
volumes=(
    "locumtruerate_postgres_test_data"
    "locumtruerate_redis_test_data"
    "locumtruerate_minio_test_data"
)

for volume in "${volumes[@]}"; do
    if docker volume ls -q | grep -q "$volume"; then
        echo "Removing volume: $volume"
        docker volume rm "$volume" 2>/dev/null || true
    fi
done

# Remove test network
echo -e "${YELLOW}🌐 Removing test network...${NC}"
if docker network ls | grep -q "locumtruerate_test-network"; then
    docker network rm locumtruerate_test-network 2>/dev/null || true
fi

# Clean up test environment file
if [ -f ".env.test" ]; then
    echo -e "${YELLOW}📝 Removing test environment file...${NC}"
    rm .env.test
fi

# Clean up any test artifacts
echo -e "${YELLOW}🗑️  Cleaning up test artifacts...${NC}"
rm -rf coverage/ 2>/dev/null || true
rm -rf test-results/ 2>/dev/null || true
rm -rf playwright-report/ 2>/dev/null || true
rm -rf .nyc_output/ 2>/dev/null || true

# Clean up any temporary test files
find . -name "*.test.log" -type f -delete 2>/dev/null || true
find . -name "test-*.tmp" -type f -delete 2>/dev/null || true

# Prune unused Docker resources
echo -e "${YELLOW}🧽 Pruning unused Docker resources...${NC}"
docker system prune -f --volumes 2>/dev/null || true

echo -e "${GREEN}✨ Test environment cleanup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Cleanup summary:${NC}"
echo "  ✅ Stopped and removed all test containers"
echo "  ✅ Removed test volumes and data"
echo "  ✅ Removed test network"
echo "  ✅ Cleaned up test artifacts"
echo "  ✅ Removed environment files"
echo ""
echo -e "${GREEN}🎉 Ready for a fresh test environment!${NC}"