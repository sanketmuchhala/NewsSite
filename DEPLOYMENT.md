# 🚀 Deployment Guide

This guide covers deploying the Weird Sounds Discovery website to Vercel with all required services.

## 📋 Prerequisites

Before deploying, ensure you have:
- GitHub repository with your code
- Vercel account (free tier works)
- API keys (optional but recommended):
  - YouTube Data API key
  - Freesound.org API key

## 🗄️ Database Setup

### 1. Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the Storage tab
3. Click "Create Database" → "Postgres"
4. Choose a name like `weird-sounds-db`
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
# YouTube Data API (enables YouTube scraping)
YOUTUBE_API_KEY=your_youtube_api_key_here

# Freesound API (enables Freesound scraping)
FREESOUND_API_KEY=your_freesound_api_key_here
```

## 📡 API Keys Setup

### YouTube Data API

1. **Google Cloud Console**
   - Go to [console.cloud.google.com](https://console.cloud.google.com/)
   - Create new project or select existing
   - Enable "YouTube Data API v3"

2. **Create API Key**
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Restrict key to YouTube Data API (recommended)
   - Copy the API key

3. **Add to Vercel**
   - In Vercel project settings → Environment Variables
   - Add `YOUTUBE_API_KEY` with your key value

### Freesound.org API

1. **Create Account**
   - Register at [freesound.org](https://freesound.org/home/register/)
   - Verify your email

2. **Get API Key**
   - Go to [freesound.org/apiv2/apply](https://freesound.org/apiv2/apply/)
   - Fill out application (describe your use case)
   - Wait for approval (usually quick)

3. **Add to Vercel**
   - Add `FREESOUND_API_KEY` in environment variables

## 🌐 Vercel Deployment

### Method 1: GitHub Integration (Recommended)

1. **Connect Repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Configure project settings:
     - Framework Preset: Next.js
     - Root Directory: `./` (if repo root)

2. **Environment Variables**
   - Add all environment variables listed above
   - Database variables are auto-added if you linked the database

3. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Visit your live site!

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

Visit `https://your-app.vercel.app/api/sounds` to verify database connection.

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
curl -X POST https://your-app.vercel.app/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"source":"all","maxSounds":20,"manual":true}'
```

Option B: GitHub Actions (Automatic)
- Push code to trigger workflow
- Or manually run workflow in GitHub Actions tab

### 3. Verify GitHub Actions

1. **Check Secrets**
   - Go to Repository Settings → Secrets and Variables → Actions
   - Add required secrets:
     ```
     POSTGRES_URL
     POSTGRES_PRISMA_URL
     POSTGRES_URL_NON_POOLING
     YOUTUBE_API_KEY (optional)
     FREESOUND_API_KEY (optional)
     NEXT_PUBLIC_APP_URL
     ```

2. **Test Workflow**
   - Go to Actions tab
   - Run "Automated Weird Sounds Scraping" manually
   - Check logs for successful execution

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
- YouTube: 10,000 requests/day (monitor quota)
- Freesound: Check rate limiting in API responses
- Implement exponential backoff if needed

**Build Failures**
```bash
# Common fixes
npm install
npm run build  # Test locally first
npm run typecheck  # Fix TypeScript errors
```

**Scraping Issues**
1. Check API key validity
2. Verify network connectivity
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
3. Add reporting mechanisms

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
- Validate audio file formats
- Implement rate limiting

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

🎉 **Congratulations!** Your Weird Sounds Discovery website is now live and ready to discover the internet's strangest audio content!