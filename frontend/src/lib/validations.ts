import { z } from 'zod';

// Enums
export const cityEnum = z.enum(['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other']);
export const propertyTypeEnum = z.enum(['Apartment', 'Villa', 'Plot', 'Office', 'Retail']);
export const bhkEnum = z.enum(['1', '2', '3', '4', 'Studio']);
export const purposeEnum = z.enum(['Buy', 'Rent']);
export const timelineEnum = z.enum(['0-3m', '3-6m', '>6m', 'Exploring']);
export const sourceEnum = z.enum(['Website', 'Referral', 'Walk-in', 'Call', 'Other']);
export const statusEnum = z.enum(['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped']);

// Base buyer schema
export const buyerSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(80, 'Full name must be at most 80 characters'),
  email: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(/^\d{10,15}$/, 'Phone must be 10-15 digits'),
  city: cityEnum,
  propertyType: propertyTypeEnum,
  bhk: bhkEnum.optional(),
  purpose: purposeEnum,
  budgetMin: z.number()
    .int('Budget must be a whole number')
    .positive('Budget must be positive')
    .optional(),
  budgetMax: z.number()
    .int('Budget must be a whole number')
    .positive('Budget must be positive')
    .optional(),
  timeline: timelineEnum,
  source: sourceEnum,
  status: statusEnum.default('New'),
  notes: z.string()
    .max(1000, 'Notes must be at most 1000 characters')
    .optional()
    .or(z.literal('')),
  tags: z.array(z.string()).default([]),
}).refine((data) => {
  // BHK required for Apartment and Villa
  if (['Apartment', 'Villa'].includes(data.propertyType) && !data.bhk) {
    return false;
  }
  return true;
}, {
  message: 'BHK is required for Apartment and Villa properties',
  path: ['bhk'],
}).refine((data) => {
  // Budget max must be >= budget min
  if (data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin) {
    return false;
  }
  return true;
}, {
  message: 'Maximum budget must be greater than or equal to minimum budget',
  path: ['budgetMax'],
});

// Create buyer schema (for new buyers)
export const createBuyerSchema = buyerSchema;

// Update buyer schema (for editing existing buyers)
export const updateBuyerSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(80, 'Full name must be at most 80 characters'),
  email: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(/^\d{10,15}$/, 'Phone must be 10-15 digits'),
  city: cityEnum,
  propertyType: propertyTypeEnum,
  bhk: bhkEnum.optional(),
  purpose: purposeEnum,
  budgetMin: z.number()
    .int('Budget must be a whole number')
    .positive('Budget must be positive')
    .optional(),
  budgetMax: z.number()
    .int('Budget must be a whole number')
    .positive('Budget must be positive')
    .optional(),
  timeline: timelineEnum,
  source: sourceEnum,
  status: statusEnum.default('New'),
  notes: z.string()
    .max(1000, 'Notes must be at most 1000 characters')
    .optional()
    .or(z.literal('')),
  tags: z.array(z.string()).default([]),
  updatedAt: z.string().datetime(),
}).refine((data) => {
  // BHK required for Apartment and Villa
  if (['Apartment', 'Villa'].includes(data.propertyType) && !data.bhk) {
    return false;
  }
  return true;
}, {
  message: 'BHK is required for Apartment and Villa properties',
  path: ['bhk'],
}).refine((data) => {
  // Budget max must be >= budget min
  if (data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin) {
    return false;
  }
  return true;
}, {
  message: 'Maximum budget must be greater than or equal to minimum budget',
  path: ['budgetMax'],
});

// CSV import schema
export const csvBuyerSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  phone: z.string().regex(/^\d{10,15}$/),
  city: cityEnum,
  propertyType: propertyTypeEnum,
  bhk: bhkEnum.optional().or(z.literal('').transform(() => undefined)),
  purpose: purposeEnum,
  budgetMin: z.union([
    z.string().transform((val: string) => val ? parseInt(val) : undefined),
    z.number().optional()
  ]).optional(),
  budgetMax: z.union([
    z.string().transform((val: string) => val ? parseInt(val) : undefined),
    z.number().optional()
  ]).optional(),
  timeline: timelineEnum,
  source: sourceEnum,
  notes: z.string().max(1000).optional().or(z.literal('').transform(() => '')),
  tags: z.union([
    z.string().transform((val) => 
      val ? val.split(',').map((t) => t.trim()).filter(Boolean) : []
    ),
    z.array(z.string())
  ]).optional().default([]),
  status: statusEnum.default('New')
}).transform((data) => {
  // Ensure tags is always an array of strings
  const tags = Array.isArray(data.tags) 
    ? data.tags 
    : (typeof data.tags === 'string' 
        ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) 
        : []);
        
  return {
    ...data,
    tags: tags
  };
}).refine((data: { propertyType: string; bhk: string | undefined }) => {
  if (['Apartment', 'Villa'].includes(data.propertyType) && !data.bhk) {
    return false;
  }
  return true;
}, {
  message: 'BHK is required for Apartment and Villa properties',
  path: ['bhk']
}).refine((data: { budgetMin?: number; budgetMax?: number }) => {
  if (data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin) {
    return false;
  }
  return true;
}, {
  message: 'Maximum budget must be greater than or equal to minimum budget',
  path: ['budgetMax']
});

// Search/filter schema
export const searchSchema = z.object({
  query: z.string().optional(),
  city: cityEnum.optional(),
  propertyType: propertyTypeEnum.optional(),
  status: statusEnum.optional(),
  timeline: timelineEnum.optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(10),
  sortBy: z.enum(['fullName', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Rate limiting schema
export const rateLimitSchema = z.object({
  identifier: z.string(),
  limit: z.number().int().positive(),
  window: z.number().int().positive(), // in seconds
});

// Types
export type Buyer = z.infer<typeof buyerSchema>;
export type CreateBuyer = z.infer<typeof createBuyerSchema>;
export type UpdateBuyer = z.infer<typeof updateBuyerSchema>;
export type CsvBuyer = z.infer<typeof csvBuyerSchema>;
export type SearchParams = z.infer<typeof searchSchema>;

export type City = z.infer<typeof cityEnum>;
export type PropertyType = z.infer<typeof propertyTypeEnum>;
export type BHK = z.infer<typeof bhkEnum>;
export type Purpose = z.infer<typeof purposeEnum>;
export type Timeline = z.infer<typeof timelineEnum>;
export type Source = z.infer<typeof sourceEnum>;
export type Status = z.infer<typeof statusEnum>;
