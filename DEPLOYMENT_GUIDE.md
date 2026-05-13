# PNG Requisition System - Production Deployment Guide

## Pre-Deployment Checklist

### Environment Configuration
- [ ] Create `.env.local` with all required variables from `.env.example`
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` to your Supabase project URL
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your Supabase anon key
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` to your Supabase service role key
- [ ] Set `RESEND_API_KEY` for email functionality
- [ ] Set `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Ensure `NODE_ENV=production`

### Database Setup
- [ ] Run migrations: Check `supabase_schema_complete.sql`
- [ ] Create all required tables in Supabase
- [ ] Set up Row Level Security (RLS) policies
- [ ] Enable audit logging
- [ ] Configure backup schedule

### Security
- [ ] Enable HTTPS only
- [ ] Configure CORS properly in Supabase
- [ ] Set up rate limiting on API routes
- [ ] Enable security headers (see next.config.mjs)
- [ ] Configure Content Security Policy (CSP)
- [ ] Review and test authentication flows

### Performance Optimization
- [ ] Run `npm run build` locally to test
- [ ] Check build output for warnings
- [ ] Verify image optimization settings
- [ ] Configure CDN for static assets
- [ ] Set up caching headers

### API Routes Configuration
All API routes should follow the pattern in `app/lib/api-route-template.js`:
- [ ] Implement `checkAccess()` for role-based access control
- [ ] Use `validateRequired()` for input validation
- [ ] Implement rate limiting with `checkRateLimit()`
- [ ] Use `handleAPIError()` for consistent error responses
- [ ] Add audit logging with `logAudit()`

### Monitoring & Logging
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure performance monitoring
- [ ] Set up log aggregation
- [ ] Create alerts for critical errors
- [ ] Monitor API response times

### Testing
- [ ] Run full test suite
- [ ] Test all user roles (admin, contractor, hardware_shop)
- [ ] Test authentication flows
- [ ] Test API rate limiting
- [ ] Test error handling
- [ ] Load testing with expected traffic

## Deployment Steps

### 1. Prepare Application
```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Build application
npm run build

# Test build locally
npm run start
```

### 2. Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# or use vercel env add
```

### 3. Configure Vercel
- Set Node.js version to 18 or higher
- Configure environment variables
- Set up custom domain
- Enable auto-deployments from git

### 4. Post-Deployment
- [ ] Run smoke tests on staging
- [ ] Verify all API endpoints
- [ ] Test authentication
- [ ] Check email notifications
- [ ] Monitor error logs
- [ ] Verify database connections

## Configuration Details

### Next.js Configuration (next.config.mjs)
- Compression enabled for production builds
- Security headers configured
- Image optimization enabled
- Error source maps disabled in production
- Webpack optimization for better performance

### Middleware Configuration (middleware.js)
- Authentication redirects
- Role-based access control
- Public paths excluded from auth
- Redirect chains optimized

### Supabase Configuration (app/lib/supabase-server.js)
- Service role client for admin operations
- User context preservation
- Error handling and logging
- Audit trail logging

## Troubleshooting

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript: `npx tsc --noEmit`

### Runtime Errors
- Check environment variables are set correctly
- Review Vercel logs for detailed errors
- Check Supabase connection status
- Verify API routes are properly structured

### Performance Issues
- Check bundle size: `npm run build` output
- Monitor Vercel analytics
- Review Supabase query performance
- Optimize database indexes

## Maintenance

### Regular Tasks
- Monitor error logs daily
- Review performance metrics weekly
- Update dependencies monthly
- Run security audits quarterly
- Review and optimize database queries

### Updating
```bash
# Update Next.js
npm update next

# Update Supabase
npm update @supabase/supabase-js @supabase/ssr

# Update all dependencies
npm update
```

## Support Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Resend Email Guide](https://resend.com/docs)
