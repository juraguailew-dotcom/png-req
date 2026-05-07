# PNG Requisition System

A comprehensive requisition management system for Papua New Guinea, built with Next.js and Supabase.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open SQL Editor
3. Run `supabase_schema_complete.sql`
4. Create Storage Buckets:
   - `avatars` (public)
   - `products` (public)
   - `attachments` (private)

### 3. Configure Environment
Update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Get free API key from resend.com
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

- **[Setup Guide](SETUP_GUIDE.md)** - Complete setup instructions
- **[API Documentation](API_DOCUMENTATION.md)** - All API endpoints
- **[Database Schema](supabase_schema_complete.sql)** - Complete database structure

## ✨ Features

### Core Features
- ✅ Authentication & User Management
- ✅ Role-based Access (Admin, Shop, Contractor)
- ✅ Product Management with Categories
- ✅ Requisition System with Approval Workflow (K5000 threshold)
- ✅ Inventory Tracking with Low Stock Alerts
- ✅ Real-time Notifications
- ✅ Email Notifications
- ✅ Reviews & Ratings (1-5 stars)
- ✅ Messaging System
- ✅ Favourites/Wishlist
- ✅ File Upload (Supabase Storage)
- ✅ Request Templates

### Admin Features
- ✅ User Management (Verify, Change Roles, Delete)
- ✅ Dispute Resolution
- ✅ Platform Settings
- ✅ Audit Logs
- ✅ Analytics Dashboard

### Analytics
- ✅ **Contractor**: Spending analytics, request history, favourite shops
- ✅ **Shop**: Sales analytics, revenue tracking, inventory reports, ratings
- ✅ **Admin**: Platform statistics, user growth, top performers

### Additional Features
- ✅ Shop Locator with Distance Calculation
- ✅ Multi-currency Support (PNG Kina - K)
- ✅ Search & Filtering
- ✅ Pagination
- ✅ Data Validation

## 🏗️ Tech Stack

- **Framework**: Next.js 15
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Email**: Resend
- **Validation**: Zod
- **Charts**: Recharts
- **Maps**: Leaflet + OpenStreetMap
- **Styling**: Tailwind CSS

## 🗂️ Project Structure

```
app/
├── api/              # API routes
├── admin/            # Admin dashboard
├── shop/             # Shop dashboard
├── login/            # Login page
├── lib/              # Utilities
│   ├── supabase.js
│   ├── supabase-server.js
│   └── utils/
└── page.js           # Contractor dashboard
```

## 🔐 User Roles

1. **Admin** - Full system access, user management, dispute resolution
2. **Hardware Shop** - Product management, order fulfillment, inventory
3. **Contractor** - Create requisitions, view orders, rate shops

## 🌐 API Endpoints

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference.

Key endpoints:
- `/api/products` - Product CRUD
- `/api/requisitions` - Requisition management
- `/api/reviews` - Reviews & ratings
- `/api/messages` - Messaging
- `/api/analytics` - Analytics data
- `/api/shops` - Shop locator
- `/api/admin/users` - User management

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

## 🆓 Free Resources

- **Supabase**: 500MB database, 1GB storage, 2GB bandwidth
- **Vercel**: Free hosting with serverless functions
- **Resend**: 3,000 emails/month
- **Leaflet/OpenStreetMap**: Free maps, no API key needed

## 📝 Next Steps

1. ✅ Backend APIs - **COMPLETE**
2. 🔨 Build frontend UI components
3. 🔨 Implement real-time features
4. 🔨 Add Socket.io for enhanced chat
5. 🔨 Create map interface
6. 🔨 Add analytics charts
7. 🔨 Test all features
8. 🚀 Deploy to production

## 🐛 Troubleshooting

### Database Issues
- Ensure migrations are run in order
- Check RLS policies are enabled
- Verify service role key

### Email Not Sending
- Check Resend API key
- Verify sender email
- Check Resend dashboard logs

### File Upload Issues
- Ensure storage buckets exist
- Check bucket permissions
- Verify file size limits

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. Contact the administrator for contribution guidelines.

---

**Built with ❤️ for Papua New Guinea**
