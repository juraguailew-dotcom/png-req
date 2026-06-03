# Troubleshooting & Common Issues

## Application Won't Start

### Issue: "Cannot find module" errors

**Solution**:
```bash
# Clear cache and reinstall
npm run clean
npm install

# Verify TypeScript
npm run type-check

# Try building
npm run build
```

### Issue: Port 3000 already in use

**Solution**:
```bash
# Windows - Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Issue: Environment variables not loading

**Solution**:
```bash
# Verify .env.local exists
ls -la .env.local

# Check it has correct values
cat .env.local

# For production, check Vercel dashboard
# Settings → Environment Variables
```

## Authentication Issues

### Issue: "Unauthorized" errors on login

**Solution**:
```javascript
// Check Supabase credentials in .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key

// Verify in browser console
fetch('https://your-project.supabase.co/auth/v1/health')
  .then(r => r.json())
  .then(console.log)
```

### Issue: Users not redirected after login

**Check middleware configuration**:
```javascript
// middleware.js should have role-based redirects
if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
if (role === 'hardware_shop') return NextResponse.redirect(new URL('/shop', request.url));
```

### Issue: CORS errors when connecting to Supabase

**Solution**:
1. Go to Supabase Dashboard → Settings → CORS
2. Add your domain:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

### Issue: Session expires too quickly

**Solution**:
```javascript
// Update session timeout in Supabase
// Dashboard → Authentication → JWT Expiration
// Recommended: 3600 seconds (1 hour)

// Implement refresh token logic
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Redirect to login
}
```

## API Issues

### Issue: "TypeError: Failed to fetch" in browser console

**Solution**:
```javascript
// Check API route exists
console.log(await fetch('/api/test-connection'));

// Check CORS headers
// Should see in Response Headers:
// Access-Control-Allow-Origin: *
```

### Issue: API returns 404

**Check route structure**:
```
✓ Correct: app/api/users/route.js
✗ Wrong: app/api/users.js

✓ Correct: app/api/users/[id]/route.js
✗ Wrong: app/api/users/[id].js
```

### Issue: API request hangs/times out

**Solution**:
```javascript
// Add timeout to fetch
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

fetch('/api/endpoint', { signal: controller.signal })
  .finally(() => clearTimeout(timeoutId));

// Check Supabase connection
await supabaseAdmin.from('test_table').select('*').limit(1);
```

### Issue: Rate limiting errors (429)

**Solution**:
```javascript
// Check rate limit configuration in api-utils.js
checkRateLimit(user.id, 100, 60000); // 100 per minute

// Implement exponential backoff in client
const backoff = (attempt) => Math.pow(2, attempt) * 1000;
```

## Database Issues

### Issue: "RLS policy violation" errors

**Solution**:
```sql
-- Check if RLS is enabled
SELECT relrowsecurity FROM pg_class WHERE relname = 'users';

-- View existing policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Fix policies
CREATE POLICY "Users can read their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);
```

### Issue: Foreign key constraint violation

**Solution**:
```sql
-- Check constraints
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'requisitions';

-- Disable temporarily if needed
ALTER TABLE requisitions DROP CONSTRAINT fk_contractor;

-- Verify data integrity first
SELECT * FROM requisitions WHERE contractor_id NOT IN (SELECT id FROM users);

-- Re-add constraint
ALTER TABLE requisitions
ADD CONSTRAINT fk_contractor
  FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE;
```

### Issue: Query timeout

**Solution**:
```sql
-- Add indexes to slow queries
CREATE INDEX idx_requisitions_status ON requisitions(status);
CREATE INDEX idx_requisitions_contractor_status ON requisitions(contractor_id, status);

-- Check query performance
EXPLAIN ANALYZE SELECT * FROM requisitions WHERE status = 'pending';
```

### Issue: Can't connect to database

**Solution**:
```bash
# Test connection string
psql "postgres://user:password@project.supabase.co:5432/postgres"

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Verify in Supabase dashboard
# Settings → Database → Connection Info
```

## Performance Issues

### Issue: Page loads slowly

**Solution**:
```bash
# Check bundle size
npm run analyze

# Optimize images - they're in next.config.mjs
# Monitor with Lighthouse in Chrome DevTools

# Check API response times
# Use browser DevTools → Network tab
```

### Issue: High database query count

**Solution**:
```javascript
// Use Supabase single() to get single record
const { data } = await supabaseAdmin
  .from('users')
  .select('*')
  .eq('id', userId)
  .single(); // Returns single record

// Use limit for lists
query.limit(20); // Not unlimited
```

### Issue: Memory leak on long-running page

**Solution**:
```javascript
// Clean up subscriptions
useEffect(() => {
  const subscription = supabase
    .on('*', payload => handleChange(payload))
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Deployment Issues

### Issue: Build fails on Vercel

**Solution**:
```bash
# Build locally to test
npm run build

# Check for TypeScript errors
npm run type-check

# Check build logs in Vercel dashboard
# Deployments → [Your Deployment] → Logs

# Common fixes:
rm -rf .next
npm install
npm run build
```

### Issue: Environment variables not set on Vercel

**Solution**:
1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Add/update variables
4. Redeploy project

```bash
# Or use Vercel CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Select environment and enter value
vercel deploy --prod
```

### Issue: Deployment stuck or never completes

**Solution**:
1. Check Vercel dashboard for error logs
2. Cancel current deployment
3. Check for large files in output
4. Remove unnecessary dependencies
5. Try deploying again

### Issue: "502 Bad Gateway" in production

**Solution**:
```bash
# 1. Check if API is responding
curl https://yourdomain.com/api/test-connection

# 2. Restart application
# Vercel: Go to dashboard → Project Settings → Deployments → Redeploy

# 3. Check environment variables are correct
# 4. Check database is online and accessible

# 5. Check logs
# Vercel: Deployments → [Latest] → Logs
```

## Email Issues

### Issue: Emails not being sent

**Solution**:
1. Verify RESEND_API_KEY is set
2. Verify RESEND_FROM_EMAIL is correct
3. Check email provider logs:
   ```bash
   curl https://api.resend.com/emails \
     -H 'Authorization: Bearer $RESEND_API_KEY'
   ```
4. Verify email template is correct
5. Check application logs for errors

### Issue: Emails going to spam

**Solution**:
1. Set up SPF record: `v=spf1 include:sendingdomain.resend.com ~all`
2. Set up DKIM record in DNS
3. Set up DMARC policy
4. Use branded from address (not noreply)
5. Test with tools like MXToolbox

## Testing & Debugging

### Enable Debug Mode

```javascript
// In component or API route
console.log('Debug info:', { user, role, data });

// Or use browser DevTools debugger
debugger; // Execution pauses here
```

### Test API Endpoint

```bash
# GET request
curl https://yourdomain.com/api/users

# POST request
curl -X POST https://yourdomain.com/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# With authentication header
curl -H "Authorization: Bearer $TOKEN" https://yourdomain.com/api/protected
```

### Check Application Logs

**Vercel**:
1. Dashboard → Project → Deployments
2. Click on deployment
3. View logs in Functions/Output tabs

**Local**:
1. Terminal where `npm run dev` is running
2. Check browser console (F12)
3. Check `next.config.mjs` for debugging settings

## Getting Help

### Debug Information to Collect

When reporting issues, include:
1. Error message (exact text)
2. Steps to reproduce
3. Environment:
   ```bash
   node --version
   npm --version
   npm list next
   npm list @supabase/supabase-js
   ```
4. Browser: Chrome/Firefox/Safari version
5. Screenshots or video
6. Relevant code snippets
7. Recent changes that might have caused it

### Where to Get Help

- **Supabase Issues**: https://supabase.com/docs/support
- **Next.js Issues**: https://github.com/vercel/next.js/discussions
- **GitHub Issues**: Check project repo for similar issues
- **Stack Overflow**: Tag with `next.js`, `supabase`
- **Discord Communities**: Vercel, Supabase, Next.js

## Quick Fixes Checklist

- [ ] Restart dev server: `npm run dev`
- [ ] Clear browser cache: Ctrl+Shift+Delete
- [ ] Clear Next.js cache: `rm -rf .next`
- [ ] Reinstall dependencies: `npm install`
- [ ] Check environment variables
- [ ] Check browser console for errors
- [ ] Check Vercel logs if deployed
- [ ] Test API with curl or Postman
- [ ] Check database connection
- [ ] Review recent code changes
