# Multi-User Setup Guide

Enable multiple team members per Contractor and Hardware Shop organization.

---

## 📊 New Database Schema

### 1. Create Organization Tables

Run this in Supabase SQL Editor:

```sql
-- =============================================
-- CONTRACTOR ORGANIZATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.contractors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  name TEXT UNIQUE NOT NULL,
  business_registration TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  avatar_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);

ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view own org"
  ON public.contractors FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.contractor_members 
      WHERE contractor_id = contractors.id
    )
  );

-- =============================================
-- HARDWARE SHOP ORGANIZATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  name TEXT UNIQUE NOT NULL,
  business_registration TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  avatar_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shops can view own org"
  ON public.shops FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.shop_members 
      WHERE shop_id = shops.id
    )
  );

-- =============================================
-- CONTRACTOR TEAM MEMBERS
-- =============================================
CREATE TABLE IF NOT EXISTS public.contractor_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member')),
  
  UNIQUE(contractor_id, user_id)
);

ALTER TABLE public.contractor_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view team"
  ON public.contractor_members FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.contractor_members 
      WHERE contractor_id = contractor_members.contractor_id
    )
  );

-- =============================================
-- SHOP TEAM MEMBERS
-- =============================================
CREATE TABLE IF NOT EXISTS public.shop_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member')),
  
  UNIQUE(shop_id, user_id)
);

ALTER TABLE public.shop_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view team"
  ON public.shop_members FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.shop_members 
      WHERE shop_id = shop_members.shop_id
    )
  );
```

### 2. Update Users Table

```sql
-- Add org reference to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS contractor_id UUID REFERENCES public.contractors(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;

-- Ensure each user has exactly one org or neither
ALTER TABLE public.users 
ADD CONSTRAINT check_single_org 
CHECK (
  (contractor_id IS NOT NULL AND shop_id IS NULL) OR 
  (contractor_id IS NULL AND shop_id IS NOT NULL) OR 
  (contractor_id IS NULL AND shop_id IS NULL AND role = 'admin')
);
```

---

## 🔐 Updated Row Level Security (RLS)

```sql
-- =============================================
-- PRODUCTS - Updated for multi-user shops
-- =============================================

DROP POLICY IF EXISTS "Shop manages own products" ON public.products;

CREATE POLICY "Shop team manages products"
  ON public.products FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.shop_members 
      WHERE shop_id = products.shop_id
    )
  );

-- =============================================
-- REQUISITIONS - Updated for multi-user contractors
-- =============================================

DROP POLICY IF EXISTS "Contractors view own requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Contractors create requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Contractors update own pending requisitions" ON public.requisitions;

CREATE POLICY "Contractor team views requisitions"
  ON public.requisitions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.contractor_members 
      WHERE contractor_id = requisitions.contractor_id
    ) OR
    auth.uid() IN (
      SELECT user_id FROM public.shop_members 
      WHERE shop_id = requisitions.assigned_shop_id
    )
  );

CREATE POLICY "Contractor team creates requisitions"
  ON public.requisitions FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.contractor_members 
      WHERE contractor_id = NEW.contractor_id
    )
  );

CREATE POLICY "Contractor team updates own pending"
  ON public.requisitions FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.contractor_members 
      WHERE contractor_id = requisitions.contractor_id
    ) AND status = 'pending'
  );

CREATE POLICY "Shop team can fulfill"
  ON public.requisitions FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.shop_members 
      WHERE shop_id = requisitions.assigned_shop_id
    )
  );
```

---

## 🔑 API Endpoints to Add

### Team Management (`app/api/team/`)

```javascript
// app/api/team/members/route.js
// GET: List team members
// POST: Add team member (invite)
// DELETE: Remove team member

// app/api/team/members/[userId]/role/route.js
// PATCH: Update member role (owner, manager, member)

// app/api/team/invite/route.js
// POST: Send invite link to email
// GET /app/api/team/invite/accept?token=xxx - Accept invite
```

### Example Implementation

```javascript
// app/api/team/members/route.js
import { supabaseAdmin } from '@/app/lib/supabase-server';

export async function GET(req) {
  const userId = (await supabaseAdmin.auth.admin.getUserById(req.headers.get('authorization')?.split(' ')[1])).user.id;
  
  // Get user's contractor or shop
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('contractor_id, shop_id')
    .eq('id', userId)
    .single();

  if (!user.contractor_id && !user.shop_id) {
    return Response.json({ error: 'Not part of organization' }, { status: 403 });
  }

  let members;
  if (user.contractor_id) {
    const { data } = await supabaseAdmin
      .from('contractor_members')
      .select(`
        id,
        role,
        users:user_id (id, email, full_name, avatar_url)
      `)
      .eq('contractor_id', user.contractor_id);
    members = data;
  } else {
    const { data } = await supabaseAdmin
      .from('shop_members')
      .select(`
        id,
        role,
        users:user_id (id, email, full_name, avatar_url)
      `)
      .eq('shop_id', user.shop_id);
    members = data;
  }

  return Response.json(members);
}

export async function POST(req) {
  const { email, role = 'member' } = await req.json();
  const userId = (await supabaseAdmin.auth.admin.getUserById(req.headers.get('authorization')?.split(' ')[1])).user.id;

  // Get user's organization
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('contractor_id, shop_id')
    .eq('id', userId)
    .single();

  // Create invite token and send email (implement with Resend)
  // Then add to contractor_members or shop_members when accepted

  return Response.json({ success: true });
}
```

---

## 📝 Registration Flow (Updated)

### For Contractors

1. **Step 1:** Create user account (email + password)
2. **Step 2:** Create contractor organization
3. **Step 3:** User is auto-added as `owner` to `contractor_members`
4. **Step 4:** User can invite team members

### For Shops

1. **Step 1:** Create user account (email + password)
2. **Step 2:** Create shop organization
3. **Step 3:** User is auto-added as `owner` to `shop_members`
4. **Step 4:** User can invite team members

---

## 🎯 Migration Steps

1. **Backup data** (in Supabase Dashboard: Settings → Database → Backups)

2. **Run new schema** in SQL Editor (copy above SQL blocks)

3. **Migrate existing users:**
   ```sql
   -- For each user who was a contractor
   INSERT INTO public.contractors (name, owner_id)
   SELECT business_name, id FROM public.users WHERE role = 'contractor'
   RETURNING id, owner_id;
   
   -- Then update users with contractor_id
   UPDATE public.users 
   SET contractor_id = c.id
   FROM public.contractors c
   WHERE users.role = 'contractor' AND c.owner_id = users.id;
   
   -- Repeat for shops...
   ```

4. **Add team members**:
   ```sql
   INSERT INTO public.contractor_members (contractor_id, user_id, role)
   SELECT c.id, c.owner_id, 'owner'
   FROM public.contractors c;
   ```

5. **Test** in development

6. **Deploy** to production

---

## ✅ Verification

- [x] Multiple users per contractor organization
- [x] Multiple users per shop organization
- [x] Team member roles (owner, manager, member)
- [x] RLS allows team access to org data
- [x] Invite system ready to implement
- [x] Products linked to shop org (not individual user)
- [x] Requisitions linked to contractor org (not individual user)

**Next Step:** Implement the team invitation endpoints and UI components for member management.
