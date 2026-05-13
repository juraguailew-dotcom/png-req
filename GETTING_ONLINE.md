# Getting Your Project Online - Next Steps

## Overview

Your PNG Requisition System has been fully configured for production deployment. This guide walks you through the next steps to get it running online.

## Step 1: Prepare Your Environment (15 minutes)

### 1.1 Create Environment Variables File

```bash
# Copy the template
cp .env.example .env.local

# Edit the file with your actual values
# You'll need to get credentials from Supabase
```

### 1.2 Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create account
3. Create a new project (or use existing one)
4. Go to Project Settings → API
5. Copy these values to `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 1.3 Get Email Credentials (Resend)

1. Go to [resend.com](https://resend.com)
2. Sign up (free)
3. Create API key
4. Verify domain (optional but recommended)
5. Add to `.env.local`:
   - **API Key** → `RESEND_API_KEY`
   - **From Email** → `RESEND_FROM_EMAIL` (e.g., noreply@yourdomain.com)

### 1.4 Set Application URL

In `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000  # For development
NODE_ENV=development
```

## Step 2: Test Locally (30 minutes)

### 2.1 Install and Build

```bash
# Install dependencies
npm install

# Type check
npm run type-check

# Build for production
npm run build
```

If there are errors, check `TROUBLESHOOTING.md`

### 2.2 Test Locally

```bash
# Start production server
npm run start

# Or for development with auto-reload
npm run dev
```

### 2.3 Test Core Functionality

1. Open http://localhost:3000/login
2. Test registration with your email
3. Test login
4. Test accessing protected pages
5. Test different user roles (admin, contractor, hardware_shop)

### 2.4 Test API Connection

```bash
# In browser or terminal
curl http://localhost:3000/api/test-connection

# Expected: { "status": "ok", "supabase": "connected", ... }
```

## Step 3: Deploy to Production (30 minutes)

### Option A: Deploy to Vercel (Recommended)

**Why Vercel?**
- Free tier available
- Built for Next.js
- Automatic deployments from git
- CDN included
- Easy environment variables

**Steps**:

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Create Git Repository** (if not already done)
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/png-requisition.git
   git push -u origin main
   ```

3. **Deploy to Vercel**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

4. **Set Environment Variables in Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Settings → Environment Variables
   - Add each variable from your `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `RESEND_API_KEY`
     - `RESEND_FROM_EMAIL`
     - `NEXT_PUBLIC_APP_URL` (set to your domain)
     - `NODE_ENV=production`

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Option B: Deploy to Docker/VPS

1. **Build Docker Image**
   ```bash
   docker build -t png-requisition .
   ```

2. **Create `.env` file on server** with production values

3. **Run Container**
   ```bash
   docker-compose up -d
   ```

### Option C: Deploy to Traditional Server

1. **SSH into Server**
   ```bash
   ssh user@your-server.com
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/png-requisition.git
   cd png-requisition
   ```

3. **Setup and Build**
   ```bash
   npm install --production
   npm run build
   ```

4. **Create `.env.local` with production values**

5. **Start Application**
   ```bash
   npm run start
   ```

6. **Set up Nginx** (reverse proxy):
   ```bash
   # Copy nginx.conf to /etc/nginx/sites-available/png-requisition
   # Enable with: ln -s /etc/nginx/sites-available/png-requisition /etc/nginx/sites-enabled/
   # Test: nginx -t
   # Restart: systemctl restart nginx
   ```

## Step 4: Configure Your Domain (15 minutes)

### 4.1 Point Domain to Vercel

1. Go to your domain registrar
2. Update DNS records to point to Vercel:
   - Type: `CNAME`
   - Name: `www` (or your subdomain)
   - Value: `cname.vercel.sh`

3. In Vercel dashboard → Domains → Add domain

### 4.2 Set SSL Certificate

Vercel provides automatic SSL certificates. For Docker/VPS:

```bash
# Use Let's Encrypt for free SSL
certbot certonly --standalone -d yourdomain.com

# Copy certificates to nginx:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem → /etc/nginx/ssl/cert.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem → /etc/nginx/ssl/key.pem
```

### 4.3 Update App URL

Change in Vercel Dashboard (or `.env` on server):

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Step 5: Post-Deployment Verification (15 minutes)

### 5.1 Verify Everything Works

```bash
# Test API endpoint
curl https://yourdomain.com/api/test-connection

# Test in browser
# 1. Navigate to https://yourdomain.com
# 2. Test login page loads
# 3. Test registration
# 4. Test login with created account
# 5. Test different user types
```

### 5.2 Set Up Monitoring

**Option 1: Vercel Built-in Analytics**
- Dashboard → Analytics
- Monitor usage, performance

**Option 2: Error Tracking (Sentry)**
1. Go to [sentry.io](https://sentry.io)
2. Create account and project
3. Follow integration guide

### 5.3 Database Backup

1. Go to Supabase Dashboard
2. Settings → Backups
3. Verify automatic backups are enabled
4. Download backup for safekeeping

### 5.4 Enable Monitoring Alerts

Set up alerts for:
- High error rates
- API response time spikes
- Database connection issues

## Step 6: Ongoing Maintenance

### Daily
- Check error logs
- Monitor active users
- Review recent feedback

### Weekly
- Check performance metrics
- Review database storage
- Check backup status

### Monthly
- Update dependencies: `npm update`
- Review security audit: `npm audit`
- Optimize queries if needed
- Plan new features

### Quarterly
- Security audit
- Performance review
- Disaster recovery test
- User feedback review

## Checklist: Before Going Live

- [ ] Environment variables set on server/Vercel
- [ ] Database migrations run
- [ ] All API endpoints tested
- [ ] All user roles tested (admin, contractor, shop)
- [ ] Email notifications working
- [ ] Authentication flow tested
- [ ] Domain configured
- [ ] SSL certificate working
- [ ] Monitoring/alerts setup
- [ ] Database backup verified
- [ ] Error tracking enabled
- [ ] Team trained
- [ ] Rollback plan documented

## Troubleshooting During Deployment

### Issue: "Build failed"
```bash
# Check logs in Vercel or terminal
# Run locally first: npm run build
# Check for TypeScript errors: npm run type-check
```

### Issue: "Environment variables not found"
- Vercel: Verify in dashboard Settings → Environment Variables
- Docker: Check `.env` file exists and has values
- VPS: Check in `~/.env` or within application

### Issue: "Can't connect to database"
- Verify Supabase credentials are correct
- Check Supabase project is running
- Test with `/api/test-connection` endpoint

### Issue: "Emails not sending"
- Verify `RESEND_API_KEY` is correct
- Verify `RESEND_FROM_EMAIL` is set
- Check Resend dashboard for errors

## Next: Add Features

Once deployed, you can add:
- [ ] Payment integration
- [ ] Advanced reporting
- [ ] Real-time notifications
- [ ] Mobile app
- [ ] API for third parties
- [ ] Custom integrations

## Support

Stuck? Check these files:
- `QUICK_REFERENCE.md` - Quick command reference
- `TROUBLESHOOTING.md` - Common problems
- `CONFIGURATION_GUIDE.md` - Configuration details
- `API_SECURITY_GUIDE.md` - Security info
- `DEPLOYMENT_GUIDE.md` - Detailed deployment guide

## Success!

Your PNG Requisition System should now be running online. 

**Next steps**:
1. Share the URL with your team
2. Create admin account for system setup
3. Start using the system
4. Gather feedback
5. Plan improvements

---

**Time Estimate**: 1-2 hours total  
**Cost**: Mostly free (Vercel free tier + Supabase free tier)  
**Support**: Refer to documentation in project root
