#!/bin/bash

# Test API with Newman (Postman CLI)
# Install Newman first: npm install -g newman

echo "===== LOCUMTRUERATE API TESTING WITH NEWMAN ====="
echo ""

# Check if Newman is installed
if ! command -v newman &> /dev/null; then
    echo "Newman is not installed. Installing..."
    npm install -g newman
fi

# Set the base directory
POSTMAN_DIR="$(dirname "$0")"
COLLECTION_FILE="$POSTMAN_DIR/LocumTrueRate_API_Collection.json"
ENVIRONMENT_FILE="$POSTMAN_DIR/LocumTrueRate_Environment.json"
REPORT_DIR="$POSTMAN_DIR/reports"

# Create report directory if it doesn't exist
mkdir -p "$REPORT_DIR"

# Generate timestamp for unique report names
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Running Postman collection tests..."
echo "Collection: $COLLECTION_FILE"
echo "Environment: $ENVIRONMENT_FILE"
echo ""

# Run Newman with various reporters
newman run "$COLLECTION_FILE" \
    -e "$ENVIRONMENT_FILE" \
    --reporters cli,json,html \
    --reporter-json-export "$REPORT_DIR/test-results-$TIMESTAMP.json" \
    --reporter-html-export "$REPORT_DIR/test-results-$TIMESTAMP.html" \
    --insecure \
    --timeout-request 10000 \
    --delay-request 100

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed successfully!"
    echo ""
    echo "Reports generated:"
    echo "- JSON: $REPORT_DIR/test-results-$TIMESTAMP.json"
    echo "- HTML: $REPORT_DIR/test-results-$TIMESTAMP.html"
else
    echo ""
    echo "❌ Some tests failed. Check the reports for details."
    exit 1
fi

echo ""
echo "===== TESTING COMPLETE ====="