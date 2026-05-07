# PNG Requisition System - Role Implementation Guide

## Overview
Three user roles with distinct capabilities and workflows:

### 1. **SHOP** (`hardware_shop`)
- Hardware store/supplier accounts
- Create and manage products
- Receive and respond to purchase requests
- Manage inventory and pricing
- View and fulfill requests from contractors
- Receive payments and invoices

### 2. **CONTRACTOR** (`contractor`)
- Construction/project contractor accounts
- Browse products from shops
- Create purchase requests to shops
- Manage request history
- Leave reviews for shops
- Track spending

### 3. **ADMIN** (`admin`)
- Platform administrator
- Full access to all features
- Manage users (verify, suspend, delete)
- View all requisitions and disputes
- Access analytics dashboard
- System settings and configuration

---

## Database Schema Status
✅ **COMPLETE** - All tables, policies, and functions implemented:
- `users` - User profiles with roles
- `products` - Product catalog
- `categories` - Product categories
- `requisitions` - Purchase requests
- `templates` - Saved requisition templates
- `favourites` - Favorite products/shops
- `reviews` - Shop/contractor ratings
- `messages` - Direct messaging
- `notifications` - Event notifications
- `invoices` - Invoice tracking
- `disputes` - Dispute resolution
- `audit_logs` - Activity tracking
- `settings` - Platform configuration
- RLS Policies for all roles
- Triggers for automations

---

## Backend API Routes Implementation Status

### SHOP Routes
- [ ] `/api/shops/[id]` - Shop profile (GET, PUT)
- [ ] `/api/shop/products` - Shop product management (GET, POST, DELETE)
- [ ] `/api/shop/products/[id]` - Individual product (GET, PUT, DELETE)
- [ ] `/api/shop/requisitions` - View assigned requisitions (GET)
- [ ] `/api/shop/requisitions/[id]` - Requisition details (GET, PUT - approve/fulfill)
- [ ] `/api/shop/analytics` - Shop dashboard analytics (GET)
- [ ] `/api/shop/inventory` - Inventory management (GET, PUT - update stock)
- [ ] `/api/shop/invoices` - Shop invoices (GET)
- [ ] `/api/shop/reviews` - Shop reviews (GET)

### CONTRACTOR Routes
- [ ] `/api/contractor/requisitions` - Create, list requisitions (POST, GET)
- [ ] `/api/contractor/requisitions/[id]` - Requisition details (GET, PUT, DELETE)
- [ ] `/api/contractor/templates` - Requisition templates (GET, POST, DELETE)
- [ ] `/api/products` - Browse all products (GET) ✅ Exists
- [ ] `/api/contractors/[id]` - Contractor profile (GET, PUT)
- [ ] `/api/contractor/analytics` - Spending analytics (GET)
- [ ] `/api/contractor/reviews` - Leave reviews (POST)

### ADMIN Routes
- [ ] `/api/admin/users` - User management (GET, PUT, DELETE)
- [ ] `/api/admin/users/[id]` - User details (GET, PUT)
- [ ] `/api/admin/requisitions` - All requisitions (GET)
- [ ] `/api/admin/disputes` - Dispute management (GET, PUT)
- [ ] `/api/admin/analytics` - Platform analytics (GET)
- [ ] `/api/admin/settings` - Settings management (GET, PUT)
- [ ] `/api/admin/audit-logs` - Audit logs (GET) ✅ Exists

### Shared Routes
- [x] `/api/auth/register` ✅ Exists
- [ ] `/api/users/profile` - User profile (GET, PUT)
- [ ] `/api/notifications` - Notifications (GET, PUT)
- [ ] `/api/messages` - Messaging (GET, POST)
- [ ] `/api/products/[id]` - Product details (GET)
- [x] `/api/categories` ✅ Exists
- [x] `/api/upload` ✅ Exists
- [x] `/api/favourites` ✅ Exists
- [x] `/api/reviews` ✅ Exists

---

## Frontend Components Status

### SHOP Pages & Components
- [ ] `/shop` - Shop dashboard
  - [ ] Shop profile card
  - [ ] Revenue metrics
  - [ ] Recent orders
  - [ ] Top products
- [ ] `/shop/products` - Product management
  - [ ] Product list with bulk actions
  - [ ] Product form (create/edit)
  - [ ] Inventory tracker
  - [ ] Pricing management
- [ ] `/shop/orders` - Order fulfillment
  - [ ] Requisitions table with filters
  - [ ] Order details modal
  - [ ] Approval/fulfillment workflow
- [ ] `/shop/analytics` - Sales analytics
  - [ ] Revenue chart
  - [ ] Top customers
  - [ ] Product performance
- [ ] `/shop/reviews` - Customer reviews

### CONTRACTOR Pages & Components
- [x] `/` - Contractor dashboard ✅ Exists (Dashboard.js)
- [x] `/requisitions` - Requisitions list (needs completion)
- [x] `/requisitions/[id]` - Requisition details (needs completion)
- [x] `/requisitions/new` - Create requisition ✅ (CreateRequisition.js)
- [x] `/products` - Product browser ✅ (needs ProductList.js)
- [ ] `/shops` - Shop locator
  - [ ] Shop list with ratings
  - [ ] Shop details modal
  - [ ] Map view
- [ ] `/favourites` - Favorite products/shops ✅ (page exists)
- [ ] `/messages` - Chat interface ✅ (page exists)
- [ ] `/profile` - Profile settings
  - [ ] Company info
  - [ ] Contact details
  - [ ] Payment methods

### ADMIN Pages & Components
- [ ] `/admin` - Admin dashboard
  - [ ] Key metrics
  - [ ] System health
  - [ ] Quick actions
- [ ] `/admin/users` - User management
  - [ ] User table with search/filters
  - [ ] Verify/suspend user actions
  - [ ] User details view
- [ ] `/admin/requisitions` - All requisitions
  - [ ] Status tracking
  - [ ] Advanced filters
- [ ] `/admin/disputes` - Dispute resolution
  - [ ] Open disputes list
  - [ ] Investigation details
  - [ ] Resolution tools
- [ ] `/admin/analytics` - Platform analytics
  - [ ] Revenue trends
  - [ ] User statistics
  - [ ] System performance
- [ ] `/admin/settings` - Settings panel
  - [ ] Approval thresholds
  - [ ] Feature toggles
  - [ ] Currency & localization

### Shared Components
- [x] Header.js ✅ Exists (role-aware)
- [x] NotificationBell.js ✅ Exists
- [x] ProductCard.js ✅ Exists
- [x] Pagination.js ✅ Exists
- [ ] RoleGuard.js - Route protection component
- [ ] LoadingSpinner.js
- [ ] ErrorAlert.js
- [ ] ConfirmDialog.js
- [ ] Modal.js
- [ ] FormBuilder.js

---

## Implementation Sequence

### Phase 1: Foundation (Backend)
1. ✅ Ensure database schema is applied
2. Complete missing shared API routes
3. Implement role-based middleware enhancements

### Phase 2: Shop Role
1. Implement shop API routes
2. Create shop dashboard & analytics
3. Build product management UI
4. Build order fulfillment UI

### Phase 3: Contractor Role
1. Ensure contractor API routes are complete
2. Complete requisition list/detail pages
3. Complete product browser
4. Build shop locator
5. Complete profile pages

### Phase 4: Admin Role
1. Implement admin API routes
2. Build admin dashboard
3. Create user management UI
4. Create dispute resolution UI
5. Build analytics dashboard

### Phase 5: Integration & Testing
1. Test all role-based workflows
2. Test RLS policies
3. Test API security
4. End-to-end testing

---

## Key Features by Role

### SHOP Features
✅ Product Management
- Add/edit/delete products
- Manage pricing (unit & bulk)
- Track inventory
- Categorize products

✅ Order Management
- View pending requisitions
- Approve/reject requests
- Mark as fulfilled
- Track delivery

✅ Analytics
- Sales dashboard
- Customer insights
- Top products
- Revenue trends

✅ Communication
- Message contractors
- Receive notifications

### CONTRACTOR Features
✅ Product Browsing
- Search & filter products
- View product details
- See shop ratings

✅ Request Management
- Create requisitions
- Save templates
- Track status
- Manage requests

✅ Engagement
- Leave reviews
- Favorite products/shops
- Message shops

✅ Analytics
- Spending tracker
- Order history

### ADMIN Features
✅ Platform Management
- User verification
- User suspension
- Bulk operations

✅ Oversight
- View all requisitions
- Manage disputes
- Audit logs

✅ Configuration
- Platform settings
- Feature toggles
- Approval thresholds

✅ Analytics
- Revenue reports
- User statistics
- System metrics

---

## Testing Checklist

### Authentication & Authorization
- [ ] Shop user can only access shop routes
- [ ] Contractor user can only access contractor routes
- [ ] Admin user can access all routes
- [ ] Users cannot access other roles' data

### Shop Role Workflows
- [ ] Shop can create and manage products
- [ ] Shop receives and can fulfill orders
- [ ] Shop dashboard shows correct metrics
- [ ] Shop analytics work correctly

### Contractor Role Workflows
- [ ] Contractor can search products
- [ ] Contractor can create requisitions
- [ ] Contractor receives notifications
- [ ] Contractor can track orders

### Admin Role Workflows
- [ ] Admin can view all users
- [ ] Admin can verify/suspend users
- [ ] Admin can view all requisitions
- [ ] Admin can manage disputes
- [ ] Admin dashboard shows platform metrics

### Data Security
- [ ] RLS policies prevent unauthorized access
- [ ] Audit logs capture all actions
- [ ] Sensitive data is protected

---

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_API_URL=
```

---

## Progress Tracking

- [ ] Schema validation
- [ ] Shop backend complete
- [ ] Shop frontend complete
- [ ] Contractor backend complete
- [ ] Contractor frontend complete
- [ ] Admin backend complete
- [ ] Admin frontend complete
- [ ] Integration testing complete
- [ ] Deployment ready

