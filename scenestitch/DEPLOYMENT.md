# 🚀 SceneWeaver Render Deployment Guide

This guide will help you deploy SceneWeaver to Render.com with PostgreSQL database.

## 📋 Prerequisites

- GitHub repository with SceneWeaver code
- Render.com account
- Google Gemini API key
- Basic understanding of environment variables

## 🛠️ Step-by-Step Deployment

### 1. Prepare Your Repository

The repository is already prepared with:
- ✅ PostgreSQL setup scripts
- ✅ Database migration tools
- ✅ Production-ready configuration
- ✅ Environment variable templates

### 2. Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### 3. Deploy PostgreSQL Database

1. **Click "New" → "PostgreSQL"**
2. **Configure Database:**
   - **Name**: `scenestitch-db`
   - **Database**: `scenestitch`
   - **User**: `scenestitch_user`
   - **Region**: `Oregon (US West)` (or closest to you)
   - **Plan**: `Free` (1GB storage)

3. **Click "Create Database"**
4. **Copy the External Database URL** - you'll need this for the web service

### 4. Deploy Web Service

1. **Click "New" → "Web Service"**
2. **Connect Repository:**
   - Select `albinxavier09/SceneWeaver`
   - Branch: `main`

3. **Configure Service:**
   - **Name**: `scenestitch`
   - **Environment**: `Node`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`

4. **Build & Deploy Settings:**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:collab`

5. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3000
   NEXTAUTH_URL=https://scenestitch.onrender.com
   NEXTAUTH_SECRET=your-super-secret-key-here-make-it-long-and-random
   GEMINI_API_KEY=your-gemini-api-key-here
   WEBSOCKET_PORT=3000
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

6. **Advanced Settings:**
   - **Instance Type**: `Free` (to start)
   - **Auto-Deploy**: `Yes`

7. **Click "Create Web Service"**

### 5. Database Setup

The database will be automatically set up during the build process using the `postbuild` script. This includes:

- ✅ Creating all necessary tables
- ✅ Setting up indexes for performance
- ✅ Creating triggers for updated_at timestamps
- ✅ Migrating data from SQLite (if any)

### 6. Monitor Deployment

1. **Watch the build logs** for any errors
2. **Check the deployment status** in Render dashboard
3. **Test the application** once deployed

## 🔧 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `NEXTAUTH_URL` | Your app URL | `https://scenestitch.onrender.com` |
| `NEXTAUTH_SECRET` | NextAuth secret | `your-super-secret-key` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `WEBSOCKET_PORT` | WebSocket port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |

## 📊 Database Schema

The following tables will be created automatically:

- **users** - User accounts
- **projects** - Storyboard projects
- **project_members** - Project team members
- **project_invitations** - Project invitations
- **scenes** - Individual scenes
- **scene_connections** - Scene relationships
- **activity_log** - Collaboration tracking
- **notifications** - User notifications

## 🚨 Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check build logs in Render dashboard
   - Ensure all environment variables are set
   - Verify GitHub repository access

2. **Database Connection Error:**
   - Verify `DATABASE_URL` is correct
   - Check PostgreSQL service is running
   - Ensure database exists

3. **WebSocket Issues:**
   - Check `WEBSOCKET_PORT` environment variable
   - Verify CORS settings in server.js

4. **File Upload Issues:**
   - Note: File uploads won't persist on Render free tier
   - Consider using AWS S3 or Cloudinary for production

### Getting Help:

- Check Render logs in the dashboard
- Review the application logs
- Test locally with PostgreSQL
- Check GitHub repository for latest updates

## 🔄 Updates and Maintenance

### Automatic Deployments:
- Push to `main` branch triggers automatic deployment
- Database migrations run automatically
- Zero-downtime deployments

### Manual Updates:
1. Make changes to your code
2. Commit and push to GitHub
3. Render automatically builds and deploys
4. Monitor logs for any issues

## 💰 Cost Considerations

### Free Tier (Development):
- **Web Service**: 750 hours/month
- **PostgreSQL**: 1GB storage
- **Bandwidth**: 100GB/month
- **Sleep Mode**: After 15 minutes of inactivity

### Paid Plans (Production):
- **Starter**: $7/month - Always on, 512MB RAM
- **Standard**: $25/month - Always on, 2GB RAM
- **Pro**: $85/month - Always on, 8GB RAM

## 🎉 Success!

Once deployed, your SceneWeaver application will be available at:
`https://scenestitch.onrender.com`

### Features Available:
- ✅ User authentication
- ✅ Project management
- ✅ Scene creation and editing
- ✅ Real-time collaboration
- ✅ AI-powered content generation
- ✅ Interactive dino runner
- ✅ Animated backgrounds

### Next Steps:
1. Test all functionality
2. Set up custom domain (optional)
3. Configure file storage for uploads
4. Monitor performance and usage
5. Upgrade to paid plan when ready

---

**Need Help?** Check the logs in Render dashboard or review this guide for troubleshooting steps.
