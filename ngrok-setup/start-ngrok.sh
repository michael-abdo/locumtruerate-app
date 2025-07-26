#!/bin/bash

# ngrok Setup Script for LocumTrueRate API
# Created: 2025-07-26

echo "Starting ngrok tunnel for LocumTrueRate API..."
echo "API Server should be running on http://localhost:4000"
echo ""

# Check if API server is running
if curl -s http://localhost:4000/health > /dev/null; then
    echo "✅ API server is running"
else
    echo "❌ API server is not running. Please start it first:"
    echo "   npm start"
    exit 1
fi

echo ""
echo "Starting ngrok tunnel..."
echo "Reserved domain: mike-development.ngrok-free.app"
echo "Admin interface: http://localhost:4040"
echo ""

# Start ngrok tunnel on port 4000 with reserved domain
ngrok http --domain=mike-development.ngrok-free.app 4000