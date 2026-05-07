import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category_id: z.string().uuid().optional(),
  pricing_method: z.enum(['unit', 'bulk', 'category']).default('unit'),
  unit_price: z.number().min(0, 'Price must be positive'),
  unit: z.string().default('unit'),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  low_stock_threshold: z.number().int().min(0).default(10),
});

export const requisitionSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    product_name: z.string(),
    quantity: z.number().int().min(1),
    unit_price: z.number().min(0),
    total: z.number().min(0),
  })).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  template_id: z.string().uuid().optional(),
});

export const reviewSchema = z.object({
  requisition_id: z.string().uuid(),
  reviewee_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export const disputeSchema = z.object({
  requisition_id: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  description: z.string().optional(),
});

export const userProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  business_name: z.string().optional(),
  business_registration: z.string().optional(),
});
