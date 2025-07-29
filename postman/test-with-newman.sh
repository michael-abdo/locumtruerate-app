#!/bin/bash

# LocumTrueRate API Testing Script
# Tests all 26 endpoints using Newman (Postman CLI)

echo "===== LOCUMTRUERATE API TESTING WITH NEWMAN ====="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COLLECTION_FILE="./LocumTrueRate_API_Collection.json"
ENVIRONMENT_FILE="./LocumTrueRate_Environment.json"
REPORTS_DIR="./reports"

# Create reports directory if it doesn't exist
mkdir -p "$REPORTS_DIR"

# Check if files exist
if [ ! -f "$COLLECTION_FILE" ]; then
    echo -e "${RED}❌ Collection file not found: $COLLECTION_FILE${NC}"
    exit 1
fi

if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo -e "${RED}❌ Environment file not found: $ENVIRONMENT_FILE${NC}"
    exit 1
fi

# Check if Newman is installed
if ! command -v newman &> /dev/null; then
    echo -e "${YELLOW}Newman is not installed. Installing...${NC}"
    if command -v npm &> /dev/null; then
        npm install -g newman
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Failed to install Newman. Please install manually:${NC}"
            echo "npm install -g newman"
            echo ""
            echo -e "${BLUE}Alternative: Use the curl-based test script instead:${NC}"
            echo "./test-all-endpoints.sh"
            exit 1
        fi
    else
        echo -e "${RED}❌ npm not found. Cannot install Newman.${NC}"
        echo -e "${BLUE}Alternative: Use the curl-based test script instead:${NC}"
        echo "./test-all-endpoints.sh"
        exit 1
    fi
fi

echo -e "${BLUE}Running Postman collection tests...${NC}"
echo "Collection: $COLLECTION_FILE"
echo "Environment: $ENVIRONMENT_FILE"
echo ""

# Generate timestamp for unique report names
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Run Newman with comprehensive reporting
newman run "$COLLECTION_FILE" \
    --environment "$ENVIRONMENT_FILE" \
    --reporters cli,htmlextra,junit \
    --reporter-htmlextra-export "$REPORTS_DIR/test-report-$TIMESTAMP.html" \
    --reporter-junit-export "$REPORTS_DIR/test-results-$TIMESTAMP.xml" \
    --delay-request 100 \
    --timeout-request 10000 \
    --timeout-script 5000 \
    --insecure

# Capture Newman exit code
NEWMAN_EXIT_CODE=$?

echo ""
echo "===== TEST RESULTS ====="

if [ $NEWMAN_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📊 Reports generated:${NC}"
    echo "- HTML Report: $REPORTS_DIR/test-report-$TIMESTAMP.html"
    echo "- JUnit XML: $REPORTS_DIR/test-results-$TIMESTAMP.xml"
    echo ""
    echo -e "${BLUE}🚀 API is ready for use!${NC}"
else
    echo -e "${RED}❌ Some tests failed. Check the reports for details.${NC}"
    echo ""
    echo -e "${BLUE}📊 Reports generated:${NC}"
    echo "- HTML Report: $REPORTS_DIR/test-report-$TIMESTAMP.html"
    echo "- JUnit XML: $REPORTS_DIR/test-results-$TIMESTAMP.xml"
    echo ""
    echo -e "${YELLOW}💡 Common issues:${NC}"
    echo "- Ensure API server is running: npm start"
    echo "- Check baseUrl in environment file"
    echo "- Verify test credentials are valid"
fi

echo ""
echo "===== ENDPOINT SUMMARY ====="
echo "Total endpoints tested: 26"
echo "- Health & Info: 2 endpoints"
echo "- Authentication: 4 endpoints"
echo "- Jobs: 5 endpoints"
echo "- Applications: 8 endpoints"
echo "- Calculators: 5 endpoints"
echo "- GDPR Data Export: 3 endpoints"

exit $NEWMAN_EXIT_CODE