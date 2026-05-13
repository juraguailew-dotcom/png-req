# Database Migration Guide

## Overview

This document explains how to manage database schema migrations in the PNG Requisition System using Supabase.

## Migration Files

Migration SQL files are located in the project root:
- `supabase_migration.sql` - Initial schema
- `supabase_migration_v2.sql` - Version 2 updates
- `supabase_migration_v3.sql` - Version 3 updates
- `supabase_schema_complete.sql` - Complete current schema

## Running Migrations

### Option 1: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-id your-project-id

# Run pending migrations
supabase db push

# Create a new migration
supabase migration new create_users_table
```

### Option 2: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Create new query
5. Copy and paste migration SQL
6. Run the query

### Option 3: Using psql (Direct Connection)

```bash
# Get connection string from Supabase dashboard
psql "your-connection-string" < supabase_schema_complete.sql
```

## Creating Migrations

### Step 1: Create Migration File

Create a new `.sql` file:

```sql
-- Create new table
CREATE TABLE new_feature (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE new_feature ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all actions for admin"
  ON new_feature
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');
```

### Step 2: Test Migration Locally

```bash
# Run against staging database
supabase db push --dry-run

# Or manually test in Supabase SQL Editor
```

### Step 3: Document Migration

Add to project documentation:

```markdown
## Migration: Add new_feature table

Date: 2024-05-13
Version: v4
Status: Deployed to production

### Changes
- Created `new_feature` table
- Added RLS policies for admin access

### Rollback
```sql
DROP TABLE new_feature;
```
```

### Step 4: Deploy Migration

```bash
# Deploy to production
supabase db push

# Verify in dashboard
supabase db list
```

## Common Migrations

### Add New Table

```sql
-- Create table
CREATE TABLE products_new (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index
CREATE INDEX idx_products_category ON products_new(category_id);

-- Enable RLS
ALTER TABLE products_new ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can read products"
  ON products_new FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage products"
  ON products_new
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');
```

### Add Column to Table

```sql
-- Add new column
ALTER TABLE users
ADD COLUMN phone_verified BOOLEAN DEFAULT false,
ADD COLUMN last_login TIMESTAMPTZ;

-- Add constraint
ALTER TABLE users
ADD CONSTRAINT email_unique UNIQUE(email);

-- Update existing data
UPDATE users SET phone_verified = true WHERE phone IS NOT NULL;
```

### Create Foreign Key

```sql
-- Add foreign key constraint
ALTER TABLE requisitions
ADD CONSTRAINT fk_contractor
  FOREIGN KEY (contractor_id)
  REFERENCES users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Create index for performance
CREATE INDEX idx_requisitions_contractor ON requisitions(contractor_id);
```

### Enable Row Level Security

```sql
-- Enable RLS on table
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Default policy" ON sensitive_data;

-- Create policies for each role
CREATE POLICY "Admins can access all"
  ON sensitive_data
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

CREATE POLICY "Users can access own data"
  ON sensitive_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON sensitive_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON sensitive_data FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Best Practices

### 1. Always Create Backups Before Large Migrations

```bash
# Supabase creates automatic backups
# Verify backup exists before proceeding
# Go to Settings → Backups in Supabase dashboard
```

### 2. Test on Staging First

```bash
# Create staging branch/database
supabase db push --db-url=staging-url

# Test application with changes
npm run test

# If successful, run on production
supabase db push --db-url=production-url
```

### 3. Use Transactions for Related Changes

```sql
-- Wrap related changes in transaction
BEGIN;

-- Create new table
CREATE TABLE archive (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  old_id UUID,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Migrate data
INSERT INTO archive (old_id, data)
SELECT id, row_to_json(old_table) FROM old_table;

-- Drop old table
DROP TABLE old_table;

-- If any error occurs, all changes are rolled back
COMMIT;
```

### 4. Add Indexes for Performance

```sql
-- Add index on frequently queried columns
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_requisitions_status ON requisitions(status);
CREATE INDEX idx_requisitions_created_at ON requisitions(created_at DESC);

-- Composite index for common filter combinations
CREATE INDEX idx_requisitions_contractor_status 
  ON requisitions(contractor_id, status);
```

### 5. Handle Data Type Changes Carefully

```sql
-- Safe way to change column type
-- Create new column with new type
ALTER TABLE users
ADD COLUMN age_new INTEGER;

-- Migrate data
UPDATE users SET age_new = CAST(age_string AS INTEGER);

-- Drop old column
ALTER TABLE users DROP COLUMN age_string;

-- Rename new column
ALTER TABLE users RENAME COLUMN age_new TO age;
```

## Rollback Procedures

### Quick Rollback

If migration fails, Supabase automatically reverts uncommitted changes.

```sql
-- For already-committed changes, create reverse migration
ALTER TABLE users DROP COLUMN phone_verified;
```

### Full Database Rollback

If needed, restore from backup:

1. Go to Supabase Dashboard
2. Select your project
3. Go to Settings → Backups
4. Click Restore on backup created before migration
5. Verify all data is restored correctly

### Rollback Checklist

- [ ] Identify affected data/tables
- [ ] Create backup before rollback
- [ ] Test rollback procedure
- [ ] Notify users if necessary
- [ ] Execute rollback
- [ ] Verify all systems working
- [ ] Update documentation

## Monitoring Migrations

### Check Migration Status

```bash
# List all migrations
supabase migration list

# Check specific migration
supabase migration status <migration-name>
```

### Performance Monitoring

After migration:

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index sizes
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check slow queries
-- Use Supabase dashboard for query performance analysis
```

## Common Issues

### Issue: Migration Timeout

**Solution**:
```sql
-- Break large migration into smaller steps
-- Run complex operations in background
-- For large data migrations, use batch processing

DO $$
DECLARE
  batch_size INT := 1000;
  total_rows INT;
BEGIN
  SELECT COUNT(*) INTO total_rows FROM old_table;
  
  FOR i IN 0..((total_rows-1)/batch_size) LOOP
    INSERT INTO new_table
    SELECT * FROM old_table
    LIMIT batch_size OFFSET (i * batch_size);
    
    COMMIT;
  END LOOP;
END $$;
```

### Issue: Foreign Key Constraint Violation

**Solution**:
```sql
-- Disable constraints temporarily
ALTER TABLE dependent_table DISABLE TRIGGER ALL;

-- Perform migration
-- ... your migration SQL ...

-- Re-enable constraints
ALTER TABLE dependent_table ENABLE TRIGGER ALL;

-- Verify constraints
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'dependent_table';
```

### Issue: RLS Policy Breaks Application

**Solution**:
```sql
-- Check current policies
SELECT * FROM pg_policies
WHERE tablename = 'your_table';

-- Temporarily disable RLS
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- Fix policies
DROP POLICY IF EXISTS "bad_policy" ON your_table;
CREATE POLICY "fixed_policy" ON your_table ...;

-- Re-enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

## Documentation Template

```markdown
## Migration: [Title]

**Date**: [YYYY-MM-DD]
**Author**: [Your Name]
**Status**: [Draft/Testing/Deployed]

### Summary
Brief description of changes

### SQL Changes
```sql
-- Your migration SQL
```

### Verification Steps
1. Step to verify migration succeeded
2. Step to test functionality

### Rollback Procedure
```sql
-- SQL to rollback if needed
```

### Notes
Any additional information
```

## References

- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- [Best Practices for Database Migrations](https://www.liquibase.org/get-started/best-practices)
