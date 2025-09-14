# 🚀 Deployment Guide

This guide covers deploying the Funny News Aggregator website to Vercel with seamless GitHub integration.

## 📋 Prerequisites

Before deploying, ensure you have:
- GitHub repository with your code
- Vercel account (free tier works)
- API keys (optional but recommended):
  - Google AI API key (for enhanced summaries)

## 🗄️ Database Setup

### 1. Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the Storage tab
3. Click "Create Database" → "Postgres"
4. Choose a name like `funny-news-db`
5. Select your region (closest to users)
6. Click "Create"

### 2. Initialize Database Schema

Option A: Using Vercel CLI
```bash
npm install -g @vercel/cli
vercel login
vercel env pull .env.local  # Download environment variables
psql $POSTGRES_URL < lib/db/schema.sql
```

Option B: Using Web Interface
1. In Vercel dashboard, go to your database
2. Click "Query" tab
3. Copy and paste contents of `lib/db/schema.sql`
4. Click "Run"

Option C: Using Migration Script
```bash
npm run migrate:news
```

## 🔑 Environment Variables

### Required Variables
```env
# Database (automatically provided by Vercel)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# Application
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

### Optional API Keys
```env
# Google AI API (enables enhanced story summaries)
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

## 📡 API Keys Setup

### Google AI API (Optional)

1. **Google AI Studio**
   - Go to [aistudio.google.com](https://aistudio.google.com/)
   - Sign in with Google account
   - Click "Get API Key"

2. **Create API Key**
   - Click "Create API Key"
   - Copy the generated key
   - Keep it secure

3. **Add to Vercel**
   - In Vercel project settings → Environment Variables
   - Add `GOOGLE_AI_API_KEY` with your key value

## 🌐 Vercel Deployment

### Method 1: GitHub Integration (Recommended) 📋

This is the **simplest and most automated** way to deploy:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Vercel will automatically detect it's a Next.js project

3. **Configure Project**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (leave default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

4. **Add Environment Variables**
   - Click "Environment Variables" section
   - Add your database and API keys (see variables section above)
   - Or connect your Vercel Postgres database to auto-populate

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for deployment
   - Get your live URL: `https://your-project-name.vercel.app`

6. **Automatic Deployments**
   - Every push to main branch = automatic deployment
   - Pull requests = preview deployments
   - Zero configuration needed!

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g @vercel/cli

# Login to Vercel
vercel login

# Deploy from project directory
vercel

# Follow prompts to configure project
# Set environment variables when prompted

# For production deployment
vercel --prod
```

## 🔧 Post-Deployment Configuration

### 1. Test Database Connection

Visit `https://your-app.vercel.app/api/stories` to verify database connection.

Expected response:
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "hasMore": false
  }
}
```

### 2. Initial Data Population

Option A: Manual API Call
```bash
curl -X POST https://your-app.vercel.app/api/scrape/run \
  -H "Content-Type: application/json"
```

Option B: Use the Web Interface
- Visit your deployed site
- Go to Sources page
- Click "Run Scraper" button

### 3. Verify Everything Works

1. **Check Main Pages**
   - Home page: Latest funny news stories
   - Trending page: Most upvoted stories
   - Graph page: Story relationships visualization
   - Sources page: Scraper controls

2. **Test Features**
   - Vote on stories (upvote/downvote)
   - Filter by tags and sources
   - View individual story pages
   - Check responsive design on mobile

3. **Test Admin Dashboard**
   - Visit `/dashboard`
   - Login with admin credentials (see environment variables section)
   - Test scraper functionality
   - Monitor system status

### 4. Secure Admin Access

The admin dashboard at `/dashboard` is protected by authentication:

**🔐 Production Credentials (SECURE):**
- Username: `newsadmin2024`
- Password: `FunnyNews!Secure#2024$Admin`
- Session Secret: `fN2024-d8Hj9KmP3qR7tZ5yC1xW6vE4uI9oL2sA8fG7hJ6kN5mQ3wE2rT1yU0pI9oK8lM`

**⚠️ IMPORTANT SECURITY NOTES:**
- Dashboard is NOT accessible via navigation menu for security
- Access dashboard by manually typing: `https://your-app.vercel.app/dashboard`
- Store these credentials securely (password manager recommended)
- Consider rotating credentials every 90 days for maximum security
- Session expires after 24 hours for security

**Production Setup:**
1. Set secure credentials in Vercel environment variables:
   ```
   ADMIN_USERNAME=newsadmin2024
   ADMIN_PASSWORD=FunnyNews!Secure#2024$Admin
   SESSION_SECRET=fN2024-d8Hj9KmP3qR7tZ5yC1xW6vE4uI9oL2sA8fG7hJ6kN5mQ3wE2rT1yU0pI9oK8lM
   GOOGLE_AI_API_KEY=your-google-ai-api-key
   ```

2. **Admin Features:**
   - Real-time system monitoring
   - Manual scraper execution with detailed progress tracking
   - Story management and analytics
   - Source configuration and health monitoring
   - System status indicators with error reporting

3. **Scraper Configuration:**
   The scraper has been optimized for Vercel deployment:
   - Increased timeout limits (5 minutes for scraper operations)
   - Batch processing to prevent serverless timeouts
   - Enhanced error handling and recovery
   - Automatic retry mechanisms for failed operations
   - Better resource management for RSS feeds

4. **Health Monitoring:**
   Visit `/api/health` to check system configuration and status

**Security Features:**
- Session-based authentication with secure cookie handling
- Auto-logout after 24 hours
- Protected API routes with authentication middleware
- Comprehensive error logging without exposing sensitive data

## 🎨 Custom Domain (Optional)

### 1. Configure Domain in Vercel

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as shown

### 2. Update Environment Variables

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 📊 Monitoring & Analytics

### Vercel Analytics
1. Go to Project Settings → Analytics
2. Enable Web Analytics
3. View performance metrics

### Database Monitoring
1. Go to Vercel Storage → Your Database
2. Monitor query performance
3. Set up alerts for issues

## 🚨 Troubleshooting

### Common Deployment Issues

**Database Connection Failed**
```bash
# Check environment variables
vercel env ls

# Verify database URL format
echo $POSTGRES_URL
```

**API Rate Limits**
- Google AI: Check your quota in AI Studio
- RSS feeds: Respect robots.txt and rate limits
- Implement exponential backoff if needed

**Build Failures**
```bash
# Common fixes
npm install
npm run build  # Test locally first
npm run typecheck  # Fix TypeScript errors
```

**Scraping Issues**
1. **Scraper Not Working in Dashboard:**
   ```bash
   # Check health endpoint
   curl https://your-app.vercel.app/api/health
   
   # Verify environment variables
   # - POSTGRES_URL must be set
   # - GOOGLE_AI_API_KEY recommended for enhanced content
   ```

2. **Timeout Errors:**
   - Scraper operations are limited to 5 minutes on Vercel
   - Reduce maxPerSource parameter if timeouts occur
   - Check Vercel function logs for detailed error information

3. **Database Connection Issues:**
   - Ensure Vercel Postgres database is properly connected
   - Check POSTGRES_URL environment variable
   - Verify database schema is initialized

4. **Content Source Failures:**
   - RSS feeds may be temporarily unavailable
   - Reddit/Twitter APIs require proper credentials
   - Check individual source logs in scraper output

5. **Authentication Problems:**
   - Verify admin credentials are set correctly
   - Check session cookies are enabled in browser
   - Ensure HTTPS is used in production

**Scraping Issues**
1. Check API key validity
2. Verify RSS feed accessibility
3. Monitor error logs in Vercel Functions

### Performance Issues

**Database Queries**
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC;
```

**Edge Function Timeouts**
- Increase timeout in `next.config.js`
- Split large operations into smaller chunks
- Use background processing for long tasks

## 🔄 Updates & Maintenance

### Updating Dependencies
```bash
npm update
npm audit fix
git commit -am "Update dependencies"
git push  # Triggers automatic deployment
```

### Database Migrations
1. Update `lib/db/schema.sql`
2. Run migration manually or via API
3. Test thoroughly in staging environment

### Content Moderation
1. Monitor scraped content quality
2. Implement content filtering rules
3. Add story reporting mechanisms

## 📈 Scaling Considerations

### Database Performance
- Add indexes for frequently queried fields
- Consider read replicas for heavy traffic
- Monitor connection pooling

### API Rate Limits
- Implement caching layers
- Use background processing
- Consider upgrading API quotas

### CDN & Caching
- Leverage Vercel Edge Network
- Implement proper cache headers
- Use ISR for dynamic content

## 🛡️ Security Best Practices

### Environment Variables
- Never commit API keys to repository
- Use Vercel's encrypted storage
- Rotate keys regularly

### Database Security
- Use connection pooling
- Implement proper indexing
- Monitor for suspicious queries

### Content Validation
- Sanitize user inputs
- Validate story URLs and content
- Implement rate limiting

## 📦 Quick Start Summary

**For the fastest deployment:**

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import your repo
3. Add a Vercel Postgres database
4. Connect the database to your project (auto-adds environment variables)
5. Click Deploy
6. Visit your live site and run the scraper from the Sources page

**That's it!** Vercel + GitHub integration handles everything else automatically.

## 📞 Getting Help

If you encounter issues:

1. **Check Logs**
   - Vercel Functions logs
   - GitHub Actions logs
   - Browser console errors

2. **Community Support**
   - GitHub Issues
   - Vercel Discord
   - Next.js discussions

3. **Documentation**
   - [Vercel Docs](https://vercel.com/docs)
   - [Next.js Docs](https://nextjs.org/docs)
   - API provider documentation

---

🎉 **Congratulations!** Your Funny News Aggregator website is now live and ready to discover the internet's most entertaining news stories!