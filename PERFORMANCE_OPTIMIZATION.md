# Performance Optimization Guide

## Overview

This guide provides recommendations for optimizing the PNG Requisition System for production performance.

## Frontend Optimization

### 1. Code Splitting

Already configured in `next.config.mjs`:

```javascript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.optimization = {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: { /* vendor code separated */ },
          common: { /* shared code separated */ },
        },
      },
    };
  }
  return config;
}
```

### 2. Image Optimization

Images are optimized in `next.config.mjs`. To use optimized images:

```jsx
import Image from 'next/image';

// ✓ Good - uses optimization
<Image src="/photo.jpg" width={400} height={300} alt="Photo" />

// ✗ Bad - HTML img tag
<img src="/photo.jpg" />
```

### 3. Font Optimization

Currently using Geist fonts which are optimized:

```typescript
// From layout.tsx
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
```

Optimize further:

```typescript
// Load only needed subsets
const geistSans = Geist({
  subsets: ["latin"], // Only Latin characters
});
```

### 4. Lazy Loading

Lazy load non-critical components:

```jsx
import dynamic from 'next/dynamic';

const ExpensiveChart = dynamic(() => import('./Chart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false,
});

export default function Dashboard() {
  return <ExpensiveChart />;
}
```

## API Optimization

### 1. Database Query Optimization

Always use indexes:

```sql
-- Create indexes on frequently filtered columns
CREATE INDEX idx_requisitions_status ON requisitions(status);
CREATE INDEX idx_requisitions_contractor ON requisitions(contractor_id);
CREATE INDEX idx_users_email ON users(email);

-- Composite index for common queries
CREATE INDEX idx_requisitions_contractor_status 
  ON requisitions(contractor_id, status);
```

### 2. Query Optimization

**Bad query - N+1 problem**:

```javascript
const requisitions = await supabaseAdmin
  .from('requisitions')
  .select('*')
  .limit(10);

// This makes N additional queries
for (const req of requisitions.data) {
  const items = await supabaseAdmin
    .from('requisition_items')
    .select('*')
    .eq('requisition_id', req.id);
}
```

**Good query - single query with joins**:

```javascript
const requisitions = await supabaseAdmin
  .from('requisitions')
  .select(`
    *,
    requisition_items(*)
  `)
  .limit(10);
```

### 3. Pagination

Always paginate results:

```javascript
const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
const offset = (page - 1) * limit;

const { data, count } = await supabaseAdmin
  .from('requisitions')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1);

return {
  data,
  pagination: {
    page,
    limit,
    total: count,
    totalPages: Math.ceil((count || 0) / limit),
  },
};
```

### 4. Caching

Implement caching for frequently accessed data:

```javascript
// Simple in-memory cache
const cache = new Map();

export async function getCachedData(key, fn, ttl = 3600) {
  if (cache.has(key)) {
    const { data, expires } = cache.get(key);
    if (expires > Date.now()) {
      return data;
    }
  }

  const data = await fn();
  cache.set(key, {
    data,
    expires: Date.now() + (ttl * 1000),
  });

  return data;
}

// Usage
const categories = await getCachedData('categories', async () => {
  return await supabaseAdmin
    .from('categories')
    .select('*');
});
```

## Bundle Size Optimization

### 1. Analyze Bundle Size

```bash
# Generate bundle analysis
npm run analyze
```

This shows you which packages take up the most space.

### 2. Remove Unused Dependencies

```bash
# Check for unused packages
npx depcheck

# Remove unused package
npm uninstall unused-package
```

### 3. Use Tree Shaking

Ensure imports are specific:

```javascript
// ✓ Good - tree-shakeable
import { formatDate } from 'date-fns';

// ✗ Bad - imports entire library
import * as dateFns from 'date-fns';
```

## Caching Strategies

### 1. Browser Caching

Set in `next.config.mjs`:

```javascript
async headers() {
  return [
    {
      source: '/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600' },
      ],
    },
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, no-cache' },
      ],
    },
  ];
}
```

### 2. API Response Caching

```javascript
// Cache API responses for a short time
const response = NextResponse.json(data);
response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300');
return response;
```

## Database Performance

### 1. Connection Pooling

Supabase handles pooling automatically, but verify settings:

1. Dashboard → Settings → Database
2. Check Connection Pooling: Enabled
3. Pool Size: Set based on concurrency needs

### 2. Query Performance

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Analyze query plan
EXPLAIN ANALYZE SELECT * FROM requisitions WHERE status = 'pending';
```

### 3. Table Maintenance

```sql
-- Vacuum tables regularly
VACUUM ANALYZE users;
VACUUM ANALYZE requisitions;

-- Check table bloat
SELECT schemaname, tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Monitoring Performance

### 1. Core Web Vitals

Monitor in production:

```javascript
// Add to layout.tsx
import { useReportWebVitals } from 'next/web-vitals';

export function reportWebVitals(metric) {
  console.log(metric);
  // Send to analytics
}
```

**Targets**:
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

### 2. Vercel Analytics

Enable analytics in Vercel dashboard:

1. Project Settings → Analytics
2. Check "Web Vitals"
3. Monitor metrics over time

### 3. Application Performance Monitoring

Integrate with services like:
- [Sentry](https://sentry.io) - Error tracking and performance
- [LogRocket](https://logrocket.com) - Session replay and analytics
- [New Relic](https://newrelic.com) - Application monitoring

```javascript
// Example: Sentry integration
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

## Production Checklist

- [ ] Bundle size analyzed and optimized
- [ ] Images optimized with Next.js Image component
- [ ] Code splitting enabled
- [ ] Database indexes created
- [ ] Cache headers configured
- [ ] Lazy loading implemented for heavy components
- [ ] API queries optimized with joins
- [ ] Pagination implemented
- [ ] Rate limiting configured
- [ ] Error tracking enabled
- [ ] Performance monitoring enabled
- [ ] Web Vitals monitored
- [ ] Compression enabled (gzip)
- [ ] Minification enabled
- [ ] Source maps disabled in production

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint | < 1.5s | - |
| Largest Contentful Paint | < 2.5s | - |
| Cumulative Layout Shift | < 0.1 | - |
| Time to Interactive | < 3.5s | - |
| API Response Time | < 500ms | - |
| Page Load Time | < 2s | - |
| Bundle Size (JS) | < 200KB | - |
| Time to First Byte | < 600ms | - |

## Optimization Resources

- [Next.js Performance](https://nextjs.org/learn/foundations/how-nextjs-works)
- [Web.dev Performance Guide](https://web.dev/performance/)
- [Vercel Web Vitals](https://vercel.com/docs/concepts/web-vitals)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
