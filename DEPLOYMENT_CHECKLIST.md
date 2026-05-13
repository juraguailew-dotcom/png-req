# Production Deployment Checklist

## Pre-Deployment (2-3 Days Before)

### Code Review
- [ ] Review all recent commits
- [ ] Check for console.log or debugging code
- [ ] Verify no hardcoded credentials
- [ ] Test all user roles (admin, contractor, hardware_shop)
- [ ] Run full test suite
- [ ] Check for TypeScript errors: `npm run type-check`

### Security Audit
- [ ] Scan dependencies: `npm audit`
- [ ] Review API authentication checks
- [ ] Verify RLS policies in Supabase
- [ ] Check rate limiting configuration
- [ ] Review error messages (no sensitive data)
- [ ] Verify CORS settings

### Database Preparation
- [ ] Backup production database
- [ ] Test migrations on staging
- [ ] Verify indexes on large tables
- [ ] Test queries for performance
- [ ] Configure backups schedule
- [ ] Test restore procedure

### Performance Testing
- [ ] Run `npm run analyze` to check bundle size
- [ ] Load test with expected traffic
- [ ] Test slow network conditions
- [ ] Verify image optimization
- [ ] Check API response times
- [ ] Monitor memory usage

## 48 Hours Before Deployment

### Staging Deployment
- [ ] Deploy to staging environment
- [ ] Run full test suite on staging
- [ ] Test all user workflows
- [ ] Verify all integrations (email, payments, etc.)
- [ ] Check error tracking setup
- [ ] Test database backups

### Documentation
- [ ] Update README with current status
- [ ] Document any known issues
- [ ] Prepare rollback plan
- [ ] Update runbooks
- [ ] Brief team on changes

## 24 Hours Before Deployment

### Final Checks
- [ ] Confirm all environment variables set
- [ ] Verify DNS/domain configuration
- [ ] Test SSL certificate
- [ ] Confirm Vercel deployment settings
- [ ] Review error tracking
- [ ] Setup monitoring dashboards

### Team Communication
- [ ] Notify team of deployment time
- [ ] Schedule post-deployment review
- [ ] Ensure support team is ready
- [ ] Prepare communication for users if needed

## Deployment Day

### Pre-Deployment (1 Hour Before)
- [ ] Do final code check
- [ ] Verify all systems operational
- [ ] Test staging one more time
- [ ] Ensure backup is fresh
- [ ] Brief team on deployment
- [ ] Set up communication channels

### Deployment Steps

1. **Build and Test**
   ```bash
   npm run build
   npm run type-check
   ```

2. **Push to Repository**
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

3. **Vercel Deployment**
   - Vercel auto-deploys on git push (if configured)
   - Or manually deploy: `vercel --prod`

4. **Post-Deployment Verification**
   - [ ] Check deployment status
   - [ ] Verify all pages load
   - [ ] Test authentication flows
   - [ ] Check API endpoints
   - [ ] Test user interactions
   - [ ] Monitor error tracking

### Immediate Post-Deployment (15 Minutes)

- [ ] Monitor error logs
- [ ] Check API response times
- [ ] Monitor database connections
- [ ] Verify email notifications
- [ ] Test critical workflows
- [ ] Check performance metrics

### Short-term Monitoring (First Hour)

- [ ] Monitor error rates
- [ ] Watch server response times
- [ ] Check database queries
- [ ] Monitor user login success
- [ ] Verify all features working
- [ ] Monitor traffic patterns

### First 24 Hours

- [ ] Continue monitoring metrics
- [ ] Fix any issues that arise
- [ ] Check email delivery
- [ ] Verify all integrations
- [ ] Monitor user feedback
- [ ] Review error logs for patterns

## Rollback Plan

If critical issues occur:

### Immediate Rollback (< 5 minutes)

```bash
# Option 1: Rollback on Vercel
# Go to Vercel dashboard → Deployments → Select previous version → Rollback

# Option 2: Git rollback
git revert <commit-hash>
git push origin main
```

### Database Rollback

```bash
# If database changes were made:
# 1. Stop application
# 2. Restore from backup
# 3. Verify data integrity
# 4. Restart application
```

### Communication After Rollback

- [ ] Notify team of rollback
- [ ] Inform users of temporary issue
- [ ] Prepare post-mortem
- [ ] Identify root cause
- [ ] Plan fix before next deployment

## Post-Deployment (48 Hours - 1 Week)

### Monitoring
- [ ] Monitor error rates trend
- [ ] Check performance stability
- [ ] Verify user reports
- [ ] Review analytics
- [ ] Monitor resource usage

### Analysis
- [ ] Collect feedback
- [ ] Review error logs
- [ ] Analyze user behavior
- [ ] Check business metrics
- [ ] Document lessons learned

### Documentation
- [ ] Update deployment notes
- [ ] Record any issues encountered
- [ ] Update troubleshooting guide
- [ ] Document any workarounds
- [ ] Plan improvements for next deployment

## Critical Monitoring Metrics

### Application Health
- Page load time (target: < 2s)
- API response time (target: < 500ms)
- Error rate (target: < 0.1%)
- 404 errors
- 5xx errors

### User Experience
- Login success rate
- Page navigation errors
- Feature usage
- User complaints
- Performance complaints

### Infrastructure
- CPU usage
- Memory usage
- Database connections
- Disk space
- Network bandwidth

## Contact Information

**On-Call Support**:
- [ ] Primary: [Name] - [Phone]
- [ ] Secondary: [Name] - [Phone]
- [ ] Escalation: [Manager] - [Phone]

**Important Links**:
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Console: https://supabase.com/dashboard
- Error Tracking: [Your error tracking URL]
- Monitoring Dashboard: [Your monitoring URL]
- Incident Channel: [Slack channel or similar]

## Success Criteria

Deployment is successful when:
- [ ] All pages load without errors
- [ ] All users can authenticate
- [ ] All APIs respond correctly
- [ ] No spike in error rates
- [ ] Performance metrics stable
- [ ] All integrations working
- [ ] No critical issues reported
- [ ] Data integrity verified

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Reviewed By**: _______________
**Notes**: 
