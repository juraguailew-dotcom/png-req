# PNG Requisition System - Quick Reference Card

## Essential Commands

```bash
# Development
npm install                 # Install dependencies
npm run dev                 # Start dev server (http://localhost:3000)
npm run build              # Build for production
npm run start              # Start production server
npm run type-check         # Check TypeScript errors
npm run analyze            # Analyze bundle size
npm run clean              # Clean and reinstall

# Production
npm run lint               # Run ESLint
npm audit                  # Check for vulnerabilities
npm audit fix              # Fix vulnerabilities
```

## File Locations

| Component | Location |
|-----------|----------|
| Config | `next.config.mjs` |
| Auth Middleware | `middleware.js` |
| API Routes | `app/api/` |
| Components | `app/components/` |
| Pages | `app/` (login, admin, shop, requisitions, etc.) |
| Supabase Setup | `app/lib/supabase.js`, `app/lib/supabase-server.js` |
| Utilities | `app/lib/utils/`, `app/lib/api-utils.js` |
| TypeScript Config | `tsconfig.json` |
| Environment Vars | `.env.local` (create from `.env.example`) |

## Environment Variables Needed

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

## API Route Template

```javascript
import { NextResponse } from 'next/server';
import { getCallerUser, logAudit } from '@/lib/supabase-server';
import { handleAPIError, APIError } from '@/lib/api-utils';

export async function GET(request) {
  try {
    const user = await getCallerUser();
    if (!user) throw new APIError('Unauthorized', 401);
    
    // Your logic here
    return NextResponse.json({ data: [] });
  } catch (error) {
    return handleAPIError(error, request);
  }
}
```

## Authentication Flow

1. User visits `/login`
2. Enters credentials
3. Supabase authenticates
4. Middleware checks user role
5. Redirects to appropriate dashboard:
   - Admin → `/admin`
   - Hardware Shop → `/shop`
   - Contractor → `/`

## User Roles

| Role | Dashboard | Permissions |
|------|-----------|-------------|
| admin | `/admin` | Full system access |
| hardware_shop | `/shop` | Inventory & requisitions |
| contractor | `/` | Create requisitions |

## Deployment

### Vercel (Recommended)
```bash
vercel login
vercel --prod
# Set environment variables in dashboard
```

### Docker
```bash
docker build -t app .
docker-compose up -d
```

## Database

- **Type**: PostgreSQL (Supabase)
- **Migrations**: See `DATABASE_MIGRATION_GUIDE.md`
- **RLS**: Enabled on all sensitive tables
- **Backups**: Automatic via Supabase

## API Endpoints Quick List

### Requisitions
- `GET /api/requisitions` - List requisitions
- `POST /api/requisitions` - Create requisition
- `GET /api/requisitions/[id]` - Get single
- `PUT /api/requisitions/[id]` - Update
- `DELETE /api/requisitions/[id]` - Delete

### Admin
- `GET /api/admin/users` - List users
- `GET /api/admin/analytics` - Analytics
- `POST /api/admin/settings` - Update settings

### Shop
- `GET /api/shop/products` - List products
- `POST /api/shop/products` - Add product
- `GET /api/shop/inventory` - Inventory

### General
- `GET /api/test-connection` - Health check
- `GET /api/categories` - Categories

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `PORT=3001 npm run dev` |
| Module not found | `npm install` then `npm run dev` |
| Build fails | `npm run clean` then `npm run build` |
| Env vars not loading | Restart dev server |
| Unauthorized errors | Check `.env.local` credentials |
| 404 on API | Verify route file is `route.js` not `.js` |

## Documentation

| Document | Purpose |
|----------|---------|
| `CONFIGURATION_GUIDE.md` | How to configure the app |
| `DEPLOYMENT_GUIDE.md` | How to deploy to production |
| `DEPLOYMENT_CHECKLIST.md` | Pre-deployment verification |
| `API_SECURITY_GUIDE.md` | Security best practices |
| `DATABASE_MIGRATION_GUIDE.md` | Database changes |
| `TROUBLESHOOTING.md` | Problem solving |
| `PERFORMANCE_OPTIMIZATION.md` | Performance tuning |

## Health Check

Test that everything is working:

```bash
# Start development server
npm run dev

# In another terminal, test connection
curl http://localhost:3000/api/test-connection

# Expected response:
# { "status": "ok", "supabase": "connected", ... }
```

## Security Checklist

- [ ] All env vars set in `.env.local`
- [ ] Authentication on all protected routes
- [ ] Rate limiting configured
- [ ] Error messages don't leak sensitive data
- [ ] HTTPS enabled in production
- [ ] Database RLS policies enabled
- [ ] Input validation on API routes

## Performance Tips

1. Use Supabase joins instead of multiple queries
2. Always paginate results
3. Cache frequently accessed data
4. Use Next.js Image component for images
5. Lazy load heavy components
6. Monitor bundle size: `npm run analyze`

## Getting Help

1. **Errors**: Check `TROUBLESHOOTING.md`
2. **Configuration**: See `CONFIGURATION_GUIDE.md`
3. **Security**: Read `API_SECURITY_GUIDE.md`
4. **Database**: Review `DATABASE_MIGRATION_GUIDE.md`
5. **Performance**: Check `PERFORMANCE_OPTIMIZATION.md`

## Links

- Supabase: https://supabase.com/dashboard
- Vercel: https://vercel.com/dashboard
- Next.js Docs: https://nextjs.org/docs
- TypeScript: https://www.typescriptlang.org/docs

---

**Last Updated**: May 13, 2026  
**Status**: Production Ready  
**Questions?** See documentation in project root
