---
description: Deploy the KStitch (StyleEase) application
---

# Deployment Guide for KStitch

This guide covers deploying the MERN stack application (Frontend + Backend) to production.

## Prerequisites

1.  **Git Repository**: Ensure your code is pushed to GitHub/GitLab.
2.  **Database**: You need a MongoDB connection string (e.g., MongoDB Atlas).
3.  **Accounts**:
    - [Render](https://render.com) (for Backend)
    - [Vercel](https://vercel.com) (for Frontend)

## Part 1: Backend Deployment (Render)

We will deploy the backend first so we have the API URL for the frontend.

1.  **Create a New Web Service**:
    - Go to the Render Dashboard.
    - Click "New +" -> "Web Service".
    - Connect your GitHub repository.

2.  **Configure Service**:
    - **Name**: `kstitch-backend` (or similar)
    - **Root Directory**: `backend` (Important! Your backend code is in this subfolder)
    - **Runtime**: Node
    - **Build Command**: `npm install`
    - **Start Command**: `npm start` (or `node server.js`)

3.  **Environment Variables**:
    - Add the following variables in the "Environment" tab:
      - `MONGO_URI`: Your MongoDB connection string.
      - `JWT_SECRET`: A strong secret key.
      - `GOOGLE_CLIENT_ID`: From Google Cloud Console.
      - `GOOGLE_CLIENT_SECRET`: From Google Cloud Console.
      - `R2_ACCESS_KEY_ID`: (If you use Cloudflare R2)
      - `R2_SECRET_ACCESS_KEY`: (If you use Cloudflare R2)
      - `R2_BUCKET_NAME`: (If you use Cloudflare R2)
      - `R2_ACCOUNT_ID`: (If you use Cloudflare R2)
      - `PORT`: `10000` (Render sets this automatically, but good to know)

4.  **Deploy**:
    - Click "Create Web Service".
    - Wait for the build to finish.
    - **Copy the Service URL** (e.g., `https://kstitch-backend.onrender.com`). You will need this for the frontend.

## Part 2: Frontend Deployment (Vercel)

Now we deploy the frontend and connect it to the backend.

1.  **Import Project**:
    - Go to the Vercel Dashboard.
    - Click "Add New..." -> "Project".
    - Import your GitHub repository.

2.  **Configure Project**:
    - **Framework Preset**: Vite (should be detected automatically).
    - **Root Directory**: `./` (default).
    - **Build Command**: `npm run build` (default).
    - **Output Directory**: `dist` (default).

3.  **Environment Variables**:
    - Add the following variable:
      - `VITE_API_URL`: Paste your Render Backend URL here (e.g., `https://kstitch-backend.onrender.com`).
      - **Important**: Do NOT add a trailing slash `/` to the URL if your code appends `/api/...`.

4.  **Deploy**:
    - Click "Deploy".
    - Vercel will build and deploy your site.

## Part 3: Post-Deployment

1.  **Update Google OAuth Redirect URIs**:
    - Go to Google Cloud Console.
    - Add your new Frontend URL (e.g., `https://kstitch.vercel.app`) to "Authorized JavaScript origins".
    - Add `https://kstitch.vercel.app` (and any callback paths if used) to "Authorized redirect URIs".

2.  **Cors Configuration (Backend)**:
    - Ensure your backend `server.js` allows requests from your new frontend domain.
    - Update `cors` options in `backend/server.js` to include the verified Vercel domain.

## Troubleshooting

- **"Network Error"**: Check `VITE_API_URL` in Vercel. Check CORS in Backend.
- **White Screen on Frontend**: Check browser console for errors. content_security_policy issues or missing env vars.
