# Frontend Quick Reference

## 🚀 Deployment Quick Start

```bash
# 1. Setup
cp .env.example .env.local
# Fill in your Supabase and Resend credentials

# 2. Install & Build
npm install
npm run build
npm run type-check

# 3. Test locally
npm run dev
# Open http://localhost:3000

# 4. Deploy to Vercel
git add .
git commit -m "message"
git push origin main
# Then deploy via Vercel dashboard
```

## 📋 Environment Variables

**Required for local development (.env.local):**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
RESEND_API_KEY=xxx
RESEND_FROM_EMAIL=xxx@domain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Set in Vercel dashboard (not committed):**
- Same as above, except NEXT_PUBLIC_APP_URL = your Vercel domain

## 🛣️ Route Map

### Public Routes (No Auth)
- `/login` - Login page
- `/register` - Registration (if enabled)

### Contractor Routes
- `/` - Dashboard with stats
- `/requisitions` - List requisitions
- `/requisitions/[id]` - View details
- `/requisitions/new` - Create requisition
- `/products` - Browse products
- `/shops` - Find shops
- `/favourites` - Saved items
- `/messages` - Messaging
- `/profile` - Settings

### Shop Routes
- `/shop` - Dashboard
- `/shop/products` - Manage products
- `/shop/orders` - View orders
- `/shop/inventory` - Stock management
- `/shop/analytics` - Analytics

### Admin Routes
- `/admin` - Dashboard
- `/admin/users` - User management
- `/admin/requisitions` - All requisitions
- `/admin/disputes` - Dispute resolution
- `/admin/analytics` - Platform analytics
- `/admin/settings` - Settings

### Error Routes
- `404` - Not found page
- `error` - Error boundary

## 📂 Key File Locations

```
app/
├── components/
│   ├── shared/          # Reusable components
│   │   ├── Header.js
│   │   ├── NotificationBell.js
│   │   ├── ProductCard.js
│   │   └── Pagination.js
│   └── contractor/      # Contractor components
│       ├── Dashboard.js
│       └── CreateRequisition.js
├── lib/
│   ├── supabase.js      # Supabase client
│   └── utils/
│       ├── currency.js
│       ├── email.js
│       ├── notifications.js
│       └── validation.js
├── api/                 # API routes
├── middleware.js        # Auth middleware
├── error.js            # Error boundary
├── not-found.js        # 404 page
└── [features]/page.js  # Feature pages
```

## 🎨 Component Template

**Reusable client component:**
```javascript
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase';

export default function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchData();
      }
    };
    
    init();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/endpoint');
      const result = await res.json();
      setData(result.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

## 💾 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run type-check       # Check TypeScript
npm run lint             # Run ESLint
npm run format           # Format code
npm run clean            # Clean rebuild

# Vercel deployment
vercel deploy            # Deploy to staging
vercel deploy --prod     # Deploy to production
vercel logs              # View logs
```

## 🔐 Authentication

**Check user in component:**
```javascript
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  const role = user.app_metadata?.role;
  // 'contractor', 'hardware_shop', or 'admin'
}
```

**Logout:**
```javascript
await supabase.auth.signOut();
router.push('/login');
```

## 🎯 Data Fetching Pattern

```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchData();
}, [dependency]);

const fetchData = async () => {
  try {
    const res = await fetch('/api/endpoint?param=value');
    const result = await res.json();
    setData(result.data);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};
```

## 💱 Currency Formatting

```javascript
import { formatCurrency } from '@/app/lib/utils/currency';

formatCurrency(1000);  // Returns "K1000.00"
```

## 📱 Responsive Breakpoints

```css
/* Tailwind breakpoints used */
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

Example:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 1 col mobile, 2 cols tablet, 4 cols desktop */}
</div>
```

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Run `npm run clean`, then `npm install` |
| Env vars not loading | Restart dev server with `npm run dev` |
| Supabase error | Check `.env.local` has correct credentials |
| TypeScript errors | Run `npm run type-check` to see issues |
| Styling not working | Verify Tailwind import in `globals.css` |
| 404 on routes | Check middleware.js for auth config |

## 📚 Documentation Links

- **FRONTEND_CONFIGURATION.md** - Complete setup guide
- **VERCEL_DEPLOYMENT_GUIDE.md** - Deployment steps
- **FRONTEND_STATUS.md** - Implementation status
- **FRONTEND_DEPLOYMENT_SUMMARY.md** - This summary

## ✅ Pre-Deploy Checklist

- [ ] `npm run build` succeeds
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `.env.local` filled with real credentials
- [ ] All routes tested locally
- [ ] Error pages tested (404, error boundary)
- [ ] Responsive design verified on mobile
- [ ] API calls working
- [ ] Authentication flow tested
- [ ] Git changes committed

## 🟢 Deployment Status

**Frontend**: Ready for Production ✅
**Configuration**: Complete ✅
**Documentation**: Complete ✅
**Testing**: Ready ✅

---

Last Updated: 2026-05-14
