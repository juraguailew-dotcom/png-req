# PNG Requisition System - Complete Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to SQL Editor
3. Run the complete schema: `supabase_schema_complete.sql`
4. Create Storage Buckets (in Storage section):
   - `avatars` (public)
   - `products` (public)
   - `attachments` (private)
   - `invoices` (private)
   - `disputes` (private)

### 3. Environment Variables

Update `.env.local` with your credentials:

```env
# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Notifications (Get free API key from resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 4. Get Resend API Key (Free)

1. Go to https://resend.com
2. Sign up for free account (3,000 emails/month)
3. Create API key
4. Add to `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 📦 Features Implemented

### ✅ Core Features
- [x] Authentication & User Management
- [x] Role-based Access Control (Admin, Shop, Contractor)
- [x] Product Management with Categories
- [x] Requisition System with Approval Workflow
- [x] Inventory Tracking with Low Stock Alerts
- [x] Real-time Notifications
- [x] Email Notifications
- [x] Reviews & Ratings
- [x] Messaging System
- [x] Favourites/Wishlist
- [x] File Upload (Supabase Storage)

### ✅ Admin Features
- [x] User Management (Verify, Change Roles, Delete)
- [x] Dispute Resolution
- [x] Platform Settings
- [x] Audit Logs
- [x] Analytics Dashboard

### ✅ Analytics
- [x] Contractor: Spending analytics, request history
- [x] Shop: Sales analytics, revenue tracking, inventory reports
- [x] Admin: Platform-wide statistics, user growth, top performers

### ✅ Additional Features
- [x] Shop Locator with Distance Calculation
- [x] Multi-currency Support (PNG Kina)
- [x] Search & Filtering
- [x] Pagination
- [x] Data Validation (Zod)

## 🗂️ Project Structure

```
app/
├── api/                    # API Routes
│   ├── analytics/          # Analytics endpoints
│   ├── auth/               # Authentication
│   ├── categories/         # Product categories
│   ├── disputes/           # Dispute management
│   ├── favourites/         # User favourites
│   ├── invoices/           # Invoice management
│   ├── messages/           # Chat/messaging
│   ├── notifications/      # Notifications
│   ├── products/           # Product CRUD
│   ├── requisitions/       # Requisition system
│   ├── reviews/            # Reviews & ratings
│   ├── settings/           # Platform settings
│   ├── shops/              # Shop locator
│   ├── templates/          # Request templates
│   ├── upload/             # File uploads
│   └── users/              # User profiles
├── lib/
│   ├── supabase.js         # Client-side Supabase
│   ├── supabase-server.js  # Server-side Supabase
│   └── utils/
│       ├── currency.js     # Currency formatting
│       ├── email.js        # Email service
│       ├── notifications.js # Notification helpers
│       └── validation.js   # Zod schemas
├── admin/                  # Admin dashboard
├── shop/                   # Shop dashboard
├── login/                  # Login page
└── page.js                 # Contractor dashboard
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration

### Products
- `GET /api/products` - List products (with search, filter, pagination)
- `POST /api/products` - Create product (Shop only)
- `GET /api/products/[id]` - Get product details
- `PATCH /api/products/[id]` - Update product (Shop only)
- `DELETE /api/products/[id]` - Delete product (Shop only)

### Requisitions
- `GET /api/requisitions` - List requisitions
- `POST /api/requisitions` - Create requisition (Contractor only)
- `GET /api/requisitions/[id]` - Get requisition details
- `PATCH /api/requisitions/[id]` - Update requisition (approve, assign, fulfill)

### Reviews
- `GET /api/reviews` - List reviews
- `POST /api/reviews` - Create review

### Messages
- `GET /api/messages` - List messages
- `POST /api/messages` - Send message

### Notifications
- `GET /api/notifications` - List notifications
- `PATCH /api/notifications` - Mark as read

### Analytics
- `GET /api/analytics?period=30` - Get analytics (role-based)

### Admin
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users` - Update user (role, verified)
- `DELETE /api/admin/users` - Delete user

### Disputes
- `GET /api/disputes` - List disputes
- `POST /api/disputes` - Create dispute
- `PATCH /api/disputes/[id]` - Resolve dispute (Admin only)

### Settings
- `GET /api/settings` - Get platform settings
- `PATCH /api/settings` - Update settings (Admin only)

### Shops
- `GET /api/shops?city=Port+Moresby&lat=-9.4438&lng=147.1803&radius=50` - Find shops

### Upload
- `POST /api/upload` - Upload file
- `DELETE /api/upload` - Delete file

## 🎨 Frontend Components Needed

You'll need to create UI components for:

1. **Contractor Dashboard**
   - Create requisition form
   - View requisitions list
   - Spending analytics charts
   - Favourite shops

2. **Shop Dashboard**
   - Product management (CRUD)
   - Inventory tracking
   - Order fulfillment
   - Sales analytics

3. **Admin Dashboard**
   - User management table
   - Dispute resolution
   - Platform analytics
   - Settings panel

4. **Shared Components**
   - Notifications dropdown
   - Messages/Chat interface
   - Product search & filter
   - Shop locator map (using Leaflet)
   - Review/rating component
   - File upload component

## 📊 Database Schema

See `supabase_schema_complete.sql` for complete schema including:
- users
- products
- categories
- requisitions
- reviews
- messages
- notifications
- invoices
- disputes
- favourites
- templates
- audit_logs
- settings

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Audit logging for all critical actions
- File upload restrictions
- Input validation with Zod

## 🚢 Deployment to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

> A repo-based `vercel.json` is already included for Vercel build configuration. You only need to set the production environment variables in Vercel.

## 📝 Next Steps

1. Create frontend UI components
2. Implement real-time features using Supabase Realtime
3. Add Socket.io for enhanced chat (optional)
4. Create map interface with Leaflet
5. Add charts with Recharts
6. Test all features
7. Deploy to production

## 🆓 Free Resources Used

- **Supabase**: Database, Auth, Storage, Realtime (500MB DB, 1GB storage)
- **Vercel**: Hosting & Serverless Functions (Free tier)
- **Resend**: Email notifications (3,000 emails/month)
- **Leaflet/OpenStreetMap**: Maps (Free, no API key needed)
- **Recharts**: Analytics charts (Free library)

## 🐛 Troubleshooting

### Database Issues
- Ensure all migrations are run in correct order
- Check RLS policies are enabled
- Verify service role key has admin access

### Email Not Sending
- Check Resend API key is valid
- Verify sender email is configured
- Check Resend dashboard for logs

### File Upload Issues
- Ensure storage buckets are created
- Check bucket permissions (public/private)
- Verify file size limits

## 📞 Support

For issues or questions:
1. Check Supabase logs
2. Check Vercel deployment logs
3. Review API responses in browser console

## 🎉 You're All Set!

All backend APIs are ready. Now build the frontend UI to interact with these endpoints.
