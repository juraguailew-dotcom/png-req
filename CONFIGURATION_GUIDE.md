# PNG Requisition System - Configuration Guide

## Project Structure

```
app/
├── api/                    # API routes
│   ├── admin/             # Admin endpoints
│   ├── contractor/        # Contractor-specific endpoints
│   ├── shop/              # Shop-specific endpoints
│   └── test-connection/   # Health check endpoint
├── lib/
│   ├── api-utils.js       # API error handling and utilities
│   ├── supabase.js        # Client-side Supabase
│   ├── supabase-server.js # Server-side Supabase
│   └── utils/
│       ├── email.js       # Email utilities
│       ├── notifications.js
│       ├── validation.js
│       └── currency.js
├── components/            # React components by role
├── login/                 # Authentication pages
├── admin/                 # Admin dashboard
├── shop/                  # Shop management
└── layout.tsx             # Root layout

Configuration Files:
├── next.config.mjs        # Next.js configuration
├── middleware.js          # Authentication middleware
├── tsconfig.json          # TypeScript configuration
├── .env.example           # Environment variables template
├── vercel.json            # Vercel deployment config
└── package.json           # Dependencies and scripts
```

## Key Configuration Files

### 1. next.config.mjs
**Purpose**: Next.js build and runtime configuration

**Key Settings**:
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Image optimization
- Bundle optimization
- Cache control headers

**To customize**:
```javascript
// Add your domain to image remote patterns
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'your-domain.com',
    },
  ],
},
```

### 2. middleware.js
**Purpose**: Request authentication and authorization

**Flow**:
1. Check if user is authenticated
2. Redirect unauthenticated users to login
3. Verify role-based access control
4. Handle redirects for different user roles

**To customize**:
```javascript
// Add new public paths
const PUBLIC_PATHS = ['/login', '/register', '/public-page'];

// Modify role-based redirects
const ROLE_PATHS = {
  admin: ['/admin'],
  hardware_shop: ['/shop'],
  contractor: ['/contractor'], // Add if needed
};
```

### 3. tsconfig.json
**Purpose**: TypeScript compiler configuration

**Current settings**:
- ES2017 target
- Strict mode enabled
- Module resolution: bundler
- Path alias: `@/*` → `./*`

### 4. vercel.json
**Purpose**: Vercel deployment configuration

**Environment variable mapping**:
```json
"env": {
  "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@next_public_supabase_anon_key",
  "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
  "RESEND_API_KEY": "@resend_api_key"
}
```

## API Routes Configuration

### Standard API Route Pattern

All API routes should use the template in `app/lib/api-route-template.js`:

```javascript
// Basic structure
import { getCallerUser, logAudit } from '../lib/supabase-server';
import { handleAPIError } from '../lib/api-utils';

export async function GET(request) {
  try {
    const user = await getCallerUser();
    // Your logic here
  } catch (error) {
    return handleAPIError(error, request);
  }
}
```

### Error Handling

Use `APIError` for consistent error responses:

```javascript
import { APIError } from '../lib/api-utils';

throw new APIError('User message', 400, 'ERROR_CODE');
// Returns: { error: 'User message', code: 'ERROR_CODE' }
```

### Authentication

Every API route must verify user authentication:

```javascript
const user = await getCallerUser();
if (!user) {
  throw new APIError('Unauthorized', 401, 'UNAUTHORIZED');
}
```

### Rate Limiting

Protect API routes from abuse:

```javascript
import { checkRateLimit } from '../lib/api-utils';

checkRateLimit(user.id, 100, 60000); // 100 requests per minute
```

### Audit Logging

Log important actions:

```javascript
import { logAudit } from '../lib/supabase-server';

await logAudit(user, 'CREATE', 'requisition', requisitionId, {
  items_count: items.length,
  total: total,
});
```

## Supabase Configuration

### Server-Side (`app/lib/supabase-server.js`)

**Functions**:
- `supabaseAdmin`: Service role client for admin operations
- `getCallerUser()`: Get current authenticated user
- `logAudit()`: Log actions for audit trail
- `checkPermission()`: Verify user permissions
- `getUserProfile()`: Get user profile data

**Usage**:
```javascript
import { supabaseAdmin, getCallerUser, logAudit } from '@/lib/supabase-server';

const user = await getCallerUser();
const data = await supabaseAdmin.from('table').select('*');
await logAudit(user, 'READ', 'table', id);
```

### Client-Side (`app/lib/supabase.js`)

**Functions**:
- `createClient()`: Create browser-compatible Supabase client

**Usage**:
```javascript
import { createClient } from '@/lib/supabase';

const supabase = createClient();
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
```

## Environment Setup

### Local Development
1. Create `.env.local` from `.env.example`
2. Add your local Supabase credentials
3. Set `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### Staging
1. Create Supabase staging project
2. Set `NODE_ENV=staging` (optional)
3. Configure staging credentials

### Production
1. Create Supabase production project
2. Set all environment variables on Vercel
3. Enable production-only features in config

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type check
npm run type-check

# Analyze bundle size
npm run analyze
```

## Deployment

### To Vercel

```bash
npm i -g vercel
vercel login
vercel
```

Then configure environment variables in Vercel dashboard.

### Environment Variables on Vercel
1. Project Settings → Environment Variables
2. Add each variable with appropriate scope (Production, Preview, Development)
3. Redeploy after adding variables

## Security Checklist

- [ ] Enable HTTPS only
- [ ] Configure CORS in Supabase
- [ ] Enable RLS policies
- [ ] Set up rate limiting
- [ ] Configure security headers
- [ ] Verify audit logging
- [ ] Test authentication flows
- [ ] Review permissions logic
- [ ] Enable error tracking

## Troubleshooting

### Build Fails
```bash
# Clean cache and reinstall
npm run clean
npm run build
```

### Environment Variables Not Loading
```bash
# Check if variables exist
echo $NEXT_PUBLIC_SUPABASE_URL

# Restart dev server
npm run dev
```

### API Routes Not Working
- Check middleware.js for redirect rules
- Verify authentication in route
- Check error logs in browser console
- Test with `/api/test-connection` endpoint

### Database Connection Issues
- Verify Supabase credentials
- Check RLS policies
- Ensure tables exist
- Test with Supabase Studio
