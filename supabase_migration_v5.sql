-- =============================================
-- PNG Requisition System — Migration V5
-- Run this in Supabase SQL Editor AFTER the
-- complete schema (supabase_schema_complete.sql)
-- =============================================

-- 1. Add quotation JSONB column to requisitions
--    Used by: POST /api/shop/requisitions/[id]/quotation
--             GET  /api/shop/requisitions (returns quotation field)
--             Frontend: shop/requisitions page, requisitions/quoted page
ALTER TABLE public.requisitions
  ADD COLUMN IF NOT EXISTS quotation jsonb DEFAULT NULL;

-- 2. Extend requisitions status to include 'quoted'
--    (shop has sent a quotation, awaiting contractor acceptance)
ALTER TABLE public.requisitions
  DROP CONSTRAINT IF EXISTS requisitions_status_check;

ALTER TABLE public.requisitions
  ADD CONSTRAINT requisitions_status_check
  CHECK (status IN ('pending','approved','rejected','fulfilled','cancelled','quoted'));

-- 3. Extend notifications type to include 'quotation'
--    Used by: POST /api/shop/requisitions/[id]/quotation (notifies contractor)
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('requisition','message','review','dispute','system','low_stock','quotation'));

-- 4. Add subtotal/gst fields to invoices for GST-compliant invoicing
--    (previously the schema only had 'total'; frontend now sends subtotal + gst_amount)
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS gst_amount numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_rate   numeric(5,4)  DEFAULT 0.10;

-- 5. Index for quotation queries (shops listing quoted requisitions)
CREATE INDEX IF NOT EXISTS requisitions_quotation_idx
  ON public.requisitions (assigned_shop_id, status)
  WHERE quotation IS NOT NULL;

-- Done
