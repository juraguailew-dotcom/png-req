# API Security & Validation Guide

## Overview

This guide provides best practices for securing API routes in the PNG Requisition System.

## Authentication & Authorization

### 1. Always Verify User Authentication

Every API route should start by verifying the user:

```javascript
import { getCallerUser } from '@/lib/supabase-server';
import { APIError } from '@/lib/api-utils';

export async function GET(request) {
  const user = await getCallerUser();
  if (!user) {
    throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
  }
  // ... rest of endpoint
}
```

### 2. Check Role-Based Access Control

Verify the user has permission for the action:

```javascript
const role = user.app_metadata?.role;

if (role !== 'admin' && role !== 'hardware_shop') {
  throw new APIError('This action requires admin or shop permissions', 403, 'FORBIDDEN');
}
```

### 3. Verify Resource Ownership

For user-specific resources, verify ownership:

```javascript
const { data: resource } = await supabaseAdmin
  .from('requisitions')
  .select('created_by')
  .eq('id', id)
  .single();

if (resource.created_by !== user.id && user.app_metadata?.role !== 'admin') {
  throw new APIError('You do not have permission to access this resource', 403, 'FORBIDDEN');
}
```

## Input Validation

### 1. Validate Required Fields

```javascript
import { validateRequired } from '@/lib/api-utils';

const { email, password, full_name } = await request.json();
validateRequired({ email, password, full_name }, ['email', 'password', 'full_name']);
```

### 2. Use Zod for Schema Validation

```javascript
import { z } from 'zod';

const requisitionSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive(),
    unit_price: z.number().positive(),
  })),
  notes: z.string().optional(),
});

const validated = requisitionSchema.parse(body);
```

### 3. Sanitize Input

```javascript
// Remove XSS attempts
const sanitizeInput = (input) => {
  return String(input)
    .replace(/[<>]/g, '')
    .trim();
};

const sanitizedName = sanitizeInput(user_input);
```

### 4. Validate Email Format

```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  throw new APIError('Invalid email format', 400, 'INVALID_EMAIL');
}
```

## Rate Limiting

### Prevent API Abuse

```javascript
import { checkRateLimit } from '@/lib/api-utils';

// 100 requests per minute per user
checkRateLimit(user.id, 100, 60000);

// Or per IP for public endpoints
checkRateLimit(request.headers.get('x-forwarded-for'), 50, 60000);
```

### Rate Limit Tiers by Endpoint

```javascript
// Very strict for auth endpoints
checkRateLimit(email, 5, 300000); // 5 per 5 min

// Strict for mutations
checkRateLimit(user.id, 50, 60000); // 50 per min

// Moderate for reads
checkRateLimit(user.id, 200, 60000); // 200 per min
```

## Error Handling

### Use Consistent Error Format

```javascript
import { APIError, handleAPIError } from '@/lib/api-utils';

export async function GET(request) {
  try {
    // Your code
  } catch (error) {
    return handleAPIError(error, request);
  }
}
```

### Never Expose Sensitive Data in Errors

❌ **Bad**:
```javascript
catch (error) {
  return NextResponse.json({ 
    error: error.message, // Might contain sensitive info
    sql: error.sql, // Never expose SQL
    details: error // Never expose stack trace
  }, { status: 500 });
}
```

✅ **Good**:
```javascript
catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.error(error);
  }
  return NextResponse.json({
    error: 'An error occurred',
    code: 'SERVER_ERROR'
  }, { status: 500 });
}
```

## Data Protection

### 1. Encrypt Sensitive Data

```javascript
// Sensitive fields should be encrypted at rest in Supabase
// Use Supabase encryption features for:
// - Payment information
// - Social security numbers
// - Personal identification data
```

### 2. Mask Sensitive Data in Responses

```javascript
// Don't return full credit card numbers
const maskCard = (card) => {
  return '*'.repeat(12) + card.slice(-4);
};
```

### 3. Audit Logging

```javascript
import { logAudit } from '@/lib/supabase-server';

// Log all sensitive operations
await logAudit(user, 'UPDATE', 'user_settings', userId, {
  fields_changed: ['email', 'phone'],
  timestamp: new Date().toISOString()
});
```

## Database Security

### 1. Use Prepared Statements (Automatic with Supabase)

Supabase handles parameterized queries automatically:

```javascript
// Safe - uses parameterized queries
const { data } = await supabaseAdmin
  .from('users')
  .select('*')
  .eq('email', userEmail); // Parameterized
```

### 2. Enable Row Level Security (RLS)

In Supabase, enable RLS on all tables:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Only admins can update user data"
  ON users FOR UPDATE
  USING (auth.role() = 'admin');
```

### 3. Limit Query Results

```javascript
const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
// Maximum 100 results per request

const query = supabaseAdmin
  .from('users')
  .select('*')
  .limit(limit);
```

## API Response Security

### 1. Include Security Headers

These are set globally in `next.config.mjs`:

```javascript
// X-Content-Type-Options: nosniff
// X-Frame-Options: SAMEORIGIN
// X-XSS-Protection: 1; mode=block
// Strict-Transport-Security: max-age=31536000
```

### 2. Pagination

Always implement pagination:

```javascript
const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
const offset = (page - 1) * limit;

const { data, count } = await query.range(offset, offset + limit - 1);
```

### 3. Consistent Response Format

```javascript
// Success response
return NextResponse.json({
  data: resource,
  meta: {
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }
});

// Error response
return NextResponse.json({
  error: 'Human readable message',
  code: 'MACHINE_READABLE_CODE',
  timestamp: new Date().toISOString()
}, { status: 400 });
```

## Secrets Management

### 1. Environment Variables

❌ **Never do this**:
```javascript
const apiKey = 'sk_live_abc123'; // Hardcoded key
```

✅ **Always do this**:
```javascript
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  throw new Error('Missing RESEND_API_KEY');
}
```

### 2. Verify Environment Setup

```javascript
// app/api/test-connection/route.js validates env vars
export async function GET() {
  return NextResponse.json({
    env_vars: {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      resend_api_key: !!process.env.RESEND_API_KEY,
    }
  });
}
```

## Testing Security

### Test Cases to Include

```javascript
describe('API Security', () => {
  // Test authentication
  test('should reject unauthenticated requests', async () => {
    const res = await fetch('/api/protected');
    expect(res.status).toBe(401);
  });

  // Test authorization
  test('should reject unauthorized roles', async () => {
    const res = await fetch('/api/admin', {
      headers: { Authorization: 'Bearer contractor_token' }
    });
    expect(res.status).toBe(403);
  });

  // Test input validation
  test('should validate required fields', async () => {
    const res = await fetch('/api/create', {
      method: 'POST',
      body: JSON.stringify({ name: '' }) // Missing required field
    });
    expect(res.status).toBe(400);
  });

  // Test rate limiting
  test('should rate limit requests', async () => {
    for (let i = 0; i < 101; i++) {
      await fetch('/api/endpoint');
    }
    const res = await fetch('/api/endpoint');
    expect(res.status).toBe(429);
  });
});
```

## Security Checklist

- [ ] All endpoints require authentication
- [ ] Role-based access is enforced
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] No sensitive data in error messages
- [ ] Audit logging implemented
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Secrets in environment variables
- [ ] Error tracking configured
- [ ] Testing covers security cases

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/security)
- [Next.js Security](https://nextjs.org/docs/deployment/security)
