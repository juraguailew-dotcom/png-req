# API Documentation

Base URL: `http://localhost:3000/api` (development)

## Authentication

All authenticated endpoints require a valid session cookie from Supabase Auth.

## Response Format

Success:
```json
{
  "data": {},
  "message": "Success message"
}
```

Error:
```json
{
  "error": "Error message"
}
```

---

## Products API

### List Products
```
GET /api/products?search=cement&category=uuid&shop_id=uuid&page=1&limit=20
```

Response:
```json
{
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Create Product (Shop only)
```
POST /api/products
Content-Type: application/json

{
  "name": "Cement 50kg",
  "description": "High quality cement",
  "category_id": "uuid",
  "pricing_method": "unit",
  "unit_price": 45.50,
  "unit": "bag",
  "stock": 100,
  "low_stock_threshold": 10
}
```

### Get Product
```
GET /api/products/[id]
```

### Update Product (Shop only)
```
PATCH /api/products/[id]
Content-Type: application/json

{
  "stock": 95,
  "unit_price": 46.00
}
```

### Delete Product (Shop only)
```
DELETE /api/products/[id]
```

---

## Requisitions API

### List Requisitions
```
GET /api/requisitions?status=pending&page=1&limit=20
```

Filters by user role:
- Contractor: Own requisitions
- Shop: Assigned requisitions
- Admin: All requisitions

### Create Requisition (Contractor only)
```
POST /api/requisitions
Content-Type: application/json

{
  "items": [
    {
      "product_id": "uuid",
      "product_name": "Cement 50kg",
      "quantity": 10,
      "unit_price": 45.50,
      "total": 455.00
    }
  ],
  "notes": "Urgent delivery needed",
  "template_id": "uuid" // optional
}
```

### Get Requisition
```
GET /api/requisitions/[id]
```

### Update Requisition
```
PATCH /api/requisitions/[id]
Content-Type: application/json

// Admin approve
{
  "action": "approve",
  "comment": "Approved for procurement"
}

// Admin reject
{
  "action": "reject",
  "comment": "Budget exceeded"
}

// Admin assign to shop
{
  "action": "assign",
  "shop_id": "uuid"
}

// Shop fulfill
{
  "action": "fulfill",
  "notes": "Order completed"
}

// Contractor cancel
{
  "action": "cancel"
}
```

---

## Reviews API

### List Reviews
```
GET /api/reviews?reviewee_id=uuid&page=1&limit=20
```

### Create Review
```
POST /api/reviews
Content-Type: application/json

{
  "requisition_id": "uuid",
  "reviewee_id": "uuid",
  "rating": 5,
  "comment": "Excellent service!"
}
```

---

## Messages API

### List Messages
```
GET /api/messages?with=user_id&page=1&limit=50
```

### Send Message
```
POST /api/messages
Content-Type: application/json

{
  "receiver_id": "uuid",
  "content": "Hello, is this product available?",
  "requisition_id": "uuid", // optional
  "attachments": [] // optional
}
```

---

## Notifications API

### List Notifications
```
GET /api/notifications?unread=true&page=1&limit=20
```

### Mark as Read
```
PATCH /api/notifications
Content-Type: application/json

// Mark single notification
{
  "notification_id": "uuid"
}

// Mark all as read
{
  "action": "mark_all_read"
}
```

---

## Analytics API

### Get Analytics
```
GET /api/analytics?period=30
```

Response varies by role:

**Contractor:**
```json
{
  "analytics": {
    "totalRequisitions": 25,
    "pendingRequisitions": 3,
    "totalSpent": 12500.50,
    "averageOrderValue": 500.02,
    "spendingByMonth": [...]
  }
}
```

**Shop:**
```json
{
  "analytics": {
    "totalOrders": 150,
    "totalRevenue": 75000.00,
    "averageRating": 4.5,
    "lowStockProducts": 5,
    "revenueByMonth": [...],
    "topProducts": [...]
  }
}
```

**Admin:**
```json
{
  "analytics": {
    "totalUsers": 500,
    "totalRequisitions": 1000,
    "totalRevenue": 500000.00,
    "openDisputes": 2,
    "userGrowth": [...],
    "topShops": [...],
    "topContractors": [...]
  }
}
```

---

## Admin APIs

### List Users (Admin only)
```
GET /api/admin/users?role=contractor&verified=true&search=john&page=1&limit=20
```

### Update User (Admin only)
```
PATCH /api/admin/users
Content-Type: application/json

{
  "user_id": "uuid",
  "role": "hardware_shop", // optional
  "verified": true // optional
}
```

### Delete User (Admin only)
```
DELETE /api/admin/users
Content-Type: application/json

{
  "user_id": "uuid"
}
```

---

## Disputes API

### List Disputes
```
GET /api/disputes?status=open&page=1&limit=20
```

### Create Dispute
```
POST /api/disputes
Content-Type: application/json

{
  "requisition_id": "uuid",
  "reason": "Product quality issue",
  "description": "Received damaged items"
}
```

### Resolve Dispute (Admin only)
```
PATCH /api/disputes/[id]
Content-Type: application/json

{
  "status": "resolved",
  "resolution": "Refund issued",
  "admin_notes": "Internal notes"
}
```

---

## Settings API

### Get Settings
```
GET /api/settings
```

Response:
```json
{
  "settings": {
    "approval_threshold": "5000",
    "enable_chat": "true",
    "enable_reviews": "true",
    "currency": {
      "code": "PGK",
      "symbol": "K",
      "name": "Papua New Guinea Kina"
    }
  }
}
```

### Update Setting (Admin only)
```
PATCH /api/settings
Content-Type: application/json

{
  "key": "approval_threshold",
  "value": "10000"
}
```

---

## Shops API

### Find Shops
```
GET /api/shops?city=Port+Moresby&lat=-9.4438&lng=147.1803&radius=50
```

Response:
```json
{
  "shops": [
    {
      "id": "uuid",
      "business_name": "ABC Hardware",
      "address": "123 Main St",
      "city": "Port Moresby",
      "latitude": -9.4438,
      "longitude": 147.1803,
      "distance": 5.2,
      "average_rating": "4.5",
      "review_count": 25
    }
  ]
}
```

---

## Upload API

### Upload File
```
POST /api/upload
Content-Type: multipart/form-data

file: [binary]
bucket: "avatars" | "products" | "attachments"
```

Response:
```json
{
  "url": "https://supabase.co/storage/v1/object/public/avatars/...",
  "path": "user_id/timestamp.jpg"
}
```

### Delete File
```
DELETE /api/upload
Content-Type: application/json

{
  "bucket": "avatars",
  "path": "user_id/timestamp.jpg"
}
```

---

## Categories API

### List Categories
```
GET /api/categories
```

Response:
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Building Materials",
      "description": "Cement, bricks, timber, etc."
    }
  ]
}
```

---

## User Profile API

### Get Profile
```
GET /api/users/profile
```

### Update Profile
```
PATCH /api/users/profile
Content-Type: application/json

{
  "full_name": "John Doe",
  "phone": "+675 1234567",
  "address": "123 Main St",
  "city": "Port Moresby",
  "business_name": "ABC Hardware"
}
```

---

## Authentication API

### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "role": "contractor" | "hardware_shop",
  "business_name": "ABC Hardware", // for shops
  "phone": "+675 1234567",
  "address": "123 Main St",
  "city": "Port Moresby"
}
```

---

## Error Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding in production.

## Pagination

All list endpoints support pagination:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

## Filtering

Most list endpoints support filtering via query parameters. Check individual endpoint documentation.

## Sorting

Default sorting is by `created_at DESC` (newest first).
