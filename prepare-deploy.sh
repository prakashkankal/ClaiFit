#!/bin/bash

# StyleEase Deployment Preparation Script
# This script helps prepare your application for deployment

echo "=== StyleEase Deployment Preparation ==="
echo ""

# Step 1: Check if .env files exist
echo "Step 1: Checking environment files..."
if [ ! -f ".env" ]; then
    echo "⚠️  Frontend .env file not found. Creating from example..."
    cp .env.example .env
    echo "✅ Created .env - Please update VITE_API_URL with your backend URL"
else
    echo "✅ Frontend .env exists"
fi

if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Creating from example..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env - Please update with your MongoDB URI and JWT secret"
else
    echo "✅ Backend .env exists"
fi

echo ""
echo "Step 2: Installing dependencies..."
echo "Installing frontend dependencies..."
npm install

echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo ""
echo "Step 3: Testing build process..."
echo "Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed. Please fix errors before deploying."
    exit 1
fi

echo ""
echo "Step 4: Checking for hardcoded localhost URLs..."
LOCALHOST_COUNT=$(grep -r "http://localhost:5000" src/ --include="*.js" --include="*.jsx" | wc -l)
if [ $LOCALHOST_COUNT -gt 0 ]; then
    echo "⚠️  Warning: Found $LOCALHOST_COUNT hardcoded localhost URLs in source files"
    echo "   Please update these to use the API_URL from src/config/api.js"
    echo ""
    echo "   Files with hardcoded URLs:"
    grep -r "http://localhost:5000" src/ --include="*.js" --include="*.jsx" -l
else
    echo "✅ No hardcoded localhost URLs found"
fi

echo ""
echo "=== Pre-Deployment Checklist ==="
echo "Before deploying, make sure you have:"
echo "[ ] MongoDB Atlas cluster set up"
echo "[ ] Environment variables configured in .env files"
echo "[ ] Git repository created and code pushed"
echo "[ ] Updated API URLs in frontend to use environment variables"
echo "[ ] Tested the application locally"
echo ""
echo "Next steps:"
echo "1. Choose a deployment platform (Render, Vercel, Railway, etc.)"
echo "2. Follow the deployment guide in .agent/workflows/deploy.md"
echo "3. Set environment variables in your hosting platform"
echo "4. Deploy backend first, then frontend"
echo ""
echo "For detailed instructions, run: cat .agent/workflows/deploy.md"
