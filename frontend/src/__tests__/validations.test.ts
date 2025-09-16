import { buyerSchema, csvBuyerSchema } from '@/lib/validations';

describe('Buyer Validations', () => {
  describe('buyerSchema', () => {
    it('should validate a valid buyer', () => {
      const validBuyer = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '3',
        purpose: 'Buy',
        budgetMin: 5000000,
        budgetMax: 7000000,
        timeline: '3-6m',
        source: 'Website',
        status: 'New',
        notes: 'Looking for a good apartment',
        tags: ['urgent', 'verified'],
      };

      const result = buyerSchema.safeParse(validBuyer);
      expect(result.success).toBe(true);
    });

    it('should require fullName to be at least 2 characters', () => {
      const invalidBuyer = {
        fullName: 'J',
        phone: '9876543210',
        city: 'Chandigarh',
        propertyType: 'Plot',
        purpose: 'Buy',
        timeline: '3-6m',
        source: 'Website',
      };

      const result = buyerSchema.safeParse(invalidBuyer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('fullName');
        expect(result.error.errors[0].message).toContain('at least 2 characters');
      }
    });

    it('should require phone to be 10-15 digits', () => {
      const invalidBuyer = {
        fullName: 'John Doe',
        phone: '123',
        city: 'Chandigarh',
        propertyType: 'Plot',
        purpose: 'Buy',
        timeline: '3-6m',
        source: 'Website',
      };

      const result = buyerSchema.safeParse(invalidBuyer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('phone');
        expect(result.error.errors[0].message).toContain('10-15 digits');
      }
    });

    it('should require BHK for Apartment and Villa', () => {
      const invalidBuyer = {
        fullName: 'John Doe',
        phone: '9876543210',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        purpose: 'Buy',
        timeline: '3-6m',
        source: 'Website',
      };

      const result = buyerSchema.safeParse(invalidBuyer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('BHK is required');
      }
    });

    it('should not require BHK for Plot, Office, or Retail', () => {
      const validBuyer = {
        fullName: 'John Doe',
        phone: '9876543210',
        city: 'Chandigarh',
        propertyType: 'Plot',
        purpose: 'Buy',
        timeline: '3-6m',
        source: 'Website',
      };

      const result = buyerSchema.safeParse(validBuyer);
      expect(result.success).toBe(true);
    });

    it('should validate budget constraints', () => {
      const invalidBuyer = {
        fullName: 'John Doe',
        phone: '9876543210',
        city: 'Chandigarh',
        propertyType: 'Plot',
        purpose: 'Buy',
        budgetMin: 7000000,
        budgetMax: 5000000, // Max less than min
        timeline: '3-6m',
        source: 'Website',
      };

      const result = buyerSchema.safeParse(invalidBuyer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Maximum budget must be greater than or equal to minimum budget');
      }
    });

    it('should validate email format when provided', () => {
      const invalidBuyer = {
        fullName: 'John Doe',
        email: 'invalid-email',
        phone: '9876543210',
        city: 'Chandigarh',
        propertyType: 'Plot',
        purpose: 'Buy',
        timeline: '3-6m',
        source: 'Website',
      };

      const result = buyerSchema.safeParse(invalidBuyer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('email');
        expect(result.error.errors[0].message).toContain('Invalid email format');
      }
    });

    it('should limit notes to 1000 characters', () => {
      const longNotes = 'a'.repeat(1001);
      const invalidBuyer = {
        fullName: 'John Doe',
        phone: '9876543210',
        city: 'Chandigarh',
        propertyType: 'Plot',
        purpose: 'Buy',
        timeline: '3-6m',
        source: 'Website',
        notes: longNotes,
      };

      const result = buyerSchema.safeParse(invalidBuyer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('notes');
        expect(result.error.errors[0].message).toContain('at most 1000 characters');
      }
    });
  });

  describe('csvBuyerSchema', () => {
    it('should transform and validate CSV data', () => {
      const csvRow = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '3',
        purpose: 'Buy',
        budgetMin: '5000000',
        budgetMax: '7000000',
        timeline: '3-6m',
        source: 'Website',
        notes: 'Looking for apartment',
        tags: 'urgent,verified',
        status: 'New',
      };

      const result = csvBuyerSchema.safeParse(csvRow);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.budgetMin).toBe(5000000);
        expect(result.data.budgetMax).toBe(7000000);
        expect(result.data.tags).toEqual(['urgent', 'verified']);
      }
    });

    it('should handle empty budget values', () => {
      const csvRow = {
        fullName: 'John Doe',
        phone: '9876543210',
        city: 'Chandigarh',
        propertyType: 'Plot',
        purpose: 'Buy',
        budgetMin: '',
        budgetMax: '',
        timeline: '3-6m',
        source: 'Website',
        tags: '',
        status: 'New',
      };

      const result = csvBuyerSchema.safeParse(csvRow);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.budgetMin).toBeUndefined();
        expect(result.data.budgetMax).toBeUndefined();
        expect(result.data.tags).toEqual([]);
      }
    });
  });
});
