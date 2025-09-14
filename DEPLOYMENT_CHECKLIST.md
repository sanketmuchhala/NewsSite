# 🚀 Vercel + GitHub Deployment Checklist

## Pre-Deployment Setup ✅

- [ ] Code is committed to GitHub repository
- [ ] All dependencies are installed and working locally
- [ ] `.env.example` shows all required environment variables
- [ ] Project builds successfully locally (`npm run build`)

## Vercel Setup Steps ✅

### 1. Create Vercel Account & Connect GitHub
- [ ] Sign up at [vercel.com](https://vercel.com) (free tier)
- [ ] Connect your GitHub account
- [ ] Import your repository at [vercel.com/new](https://vercel.com/new)

### 2. Configure Project Settings
- [ ] Framework: Next.js (should auto-detect)
- [ ] Root Directory: `./` (default)
- [ ] Build Command: `npm run build` (default)
- [ ] Output Directory: `.next` (default)

### 3. Set Up Database
- [ ] Create Vercel Postgres database
- [ ] Name it something like `funny-news-db`
- [ ] Connect it to your project (auto-adds environment variables)

### 4. Add Environment Variables (Optional)
- [ ] `GOOGLE_AI_API_KEY` (for enhanced summaries)
- [ ] `NEXT_PUBLIC_APP_URL` (auto-set by Vercel)

### 5. Deploy!
- [ ] Click "Deploy" button
- [ ] Wait 2-3 minutes
- [ ] Get your live URL: `https://your-project-name.vercel.app`

## Post-Deployment Verification ✅

### Test Your Site
- [ ] Visit your live URL
- [ ] Check all pages load correctly:
  - [ ] Home page (/)
  - [ ] Trending (/trending)  
  - [ ] Graph (/graph)
  - [ ] Sources (/sources)

### Initialize Database
- [ ] Go to Sources page
- [ ] Click "Run Scraper" button
- [ ] Verify stories appear on homepage

### Test Features
- [ ] Vote on stories (upvote/downvote)
- [ ] Filter by tags and sources
- [ ] View individual story pages
- [ ] Test on mobile device

## Automatic Deployments ✅

Once set up, these happen automatically:

- [ ] Every `git push` to main branch → new deployment
- [ ] Every pull request → preview deployment
- [ ] Database stays connected automatically
- [ ] Zero additional configuration needed

## Troubleshooting 🔧

If something goes wrong:

1. **Check Vercel deployment logs** - Shows build errors
2. **Check function logs** - Shows runtime errors  
3. **Verify environment variables** - Database connection issues
4. **Test locally first** - Run `npm run build` and `npm start`

## Quick Commands 📝

```bash
# Test locally before deploying
npm run build
npm run start

# Check for TypeScript errors
npm run typecheck

# Deploy via CLI (alternative)
npx vercel --prod
```

---

🎉 **That's it!** Your news aggregator will be live and automatically deploy on every GitHub push!