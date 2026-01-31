---
description: Deploy the StyleEase application to production
---

# Deployment Guide for StyleEase

This guide covers deploying your full-stack MERN application (React frontend + Node.js backend + MongoDB) to production.

## Prerequisites

Before deploying, ensure you have:
- Git repository (GitHub, GitLab, or Bitbucket)
- Environment variables ready (MongoDB URI, JWT secret, etc.)
- Node.js and npm installed
- All dependencies listed in package.json

## Option 1: Deploy to Render (Recommended - Free Tier Available)

### Step 1: Prepare Your Repository

1. **Ensure your code is pushed to a Git repository**
   ```bash
   git init
   git add .
   git commit -m "Prepare for deployment"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Create a `.gitignore` file** (if not exists)
   Make sure it includes:
   ```
   node_modules/
   .env
   dist/
   backend/node_modules/
   backend/.env
   ```

### Step 2: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Connect your Git repository
4. Configure:
   - **Name**: styleease-backend
   - **Region**: Select closest to your users
   - **Branch**: main
   - **Root Directory**: backend
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid for better performance)

5. **Add Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Your JWT secret key
   - `PORT`: 10000 (Render default)
   - `NODE_ENV`: production
   - Any other environment variables your backend needs

6. Click **Create Web Service**
7. Note your backend URL (e.g., `https://styleease-backend.onrender.com`)

### Step 3: Deploy Frontend to Render

1. In Render Dashboard, click **New +** → **Static Site**
2. Connect the same repository
3. Configure:
   - **Name**: styleease-frontend
   - **Branch**: main
   - **Root Directory**: (leave empty, as frontend is in root)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: dist

4. **Add Environment Variables**:
   - `VITE_API_URL`: Your backend URL from Step 2

5. Click **Create Static Site**

### Step 4: Update Frontend API Configuration

Before building, ensure your frontend uses the environment variable:

In your `src/` directory, update API calls to use:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
```

## Option 2: Deploy to Vercel (Frontend) + Render (Backend)

### Backend on Render
Follow Step 2 from Option 1 above

### Frontend on Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy Frontend**:
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables** in Vercel Dashboard:
   - `VITE_API_URL`: Your backend URL

## Option 3: Deploy to Railway (Full Stack)

1. Go to [Railway](https://railway.app/)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository

### Deploy Backend:
- **Root Directory**: backend
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Add Environment Variables**: MONGODB_URI, JWT_SECRET, etc.

### Deploy Frontend:
- **Root Directory**: (root)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run preview`
- **Add Environment Variables**: VITE_API_URL

## Option 4: Deploy to DigitalOcean App Platform

1. Go to [DigitalOcean](https://cloud.digitalocean.com/apps)
2. Click **Create App** → **GitHub**
3. Configure Backend and Frontend as separate components
4. Add environment variables
5. Deploy

## MongoDB Setup (Required for All Options)

### Using MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist IP addresses (use `0.0.0.0/0` for all IPs in production)
5. Get your connection string
6. Add to environment variables as `MONGODB_URI`

## Post-Deployment Checklist

- [ ] Test all API endpoints
- [ ] Verify database connections
- [ ] Test user registration/login
- [ ] Test tailor dashboard functionality
- [ ] Test order creation and management
- [ ] Verify image uploads work
- [ ] Check CORS settings
- [ ] Set up custom domain (optional)
- [ ] Set up SSL certificate (usually automatic)
- [ ] Monitor logs for errors
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure CI/CD for automatic deployments

## Environment Variables Reference

### Backend (.env)
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=production
FRONTEND_URL=your_frontend_url
```

### Frontend (.env)
```
VITE_API_URL=your_backend_url
```

## Troubleshooting

### Backend Issues
- Check logs in your hosting platform dashboard
- Verify environment variables are set correctly
- Ensure MongoDB Atlas allows connections from your host IP
- Check CORS configuration in backend

### Frontend Issues
- Verify `VITE_API_URL` is set correctly
- Check browser console for errors
- Ensure build completes successfully
- Verify API endpoints are accessible

### Common Errors
- **CORS errors**: Update CORS settings in backend to allow frontend URL
- **Database connection failed**: Check MongoDB URI and IP whitelist
- **404 on routes**: Configure routing for Single Page Application
- **Environment variables not working**: Ensure they're prefixed with `VITE_` for Vite

## Recommended Deployment Strategy

For the best free deployment:
- **Backend**: Render (free tier)
- **Frontend**: Vercel or Render Static Site (free tier)
- **Database**: MongoDB Atlas (free tier M0)

This combination provides:
- Automatic HTTPS
- Global CDN for frontend
- Automatic deployments on git push
- Good performance on free tier
- Easy scaling when needed
