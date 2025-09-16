import { buyerSchema } from '@/lib/validations';

describe('Budget Validation', () => {
  it('should reject when budgetMax < budgetMin', () => {
    const invalidData = {
      fullName: 'Test User',
      phone: '9876543210',
      city: 'Chandigarh',
      propertyType: 'Apartment',
      bhk: '3',
      purpose: 'Buy',
      budgetMin: 10000000,
      budgetMax: 5000000,
      timeline: '3-6m',
      source: 'Website',
      status: 'New'
    };

    const result = buyerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Maximum budget must be greater than or equal to minimum budget'
      );
    }
  });

  it('should accept when budgetMax >= budgetMin', () => {
    const validData = {
      fullName: 'Test User',
      phone: '9876543210',
      city: 'Chandigarh',
      propertyType: 'Apartment',
      bhk: '3',
      purpose: 'Buy',
      budgetMin: 5000000,
      budgetMax: 10000000,
      timeline: '3-6m',
      source: 'Website',
      status: 'New'
    };

    const result = buyerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
