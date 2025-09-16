import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { buyers, buyerHistory } from '@/lib/schema';
import { csvBuyerSchema, cityEnum, propertyTypeEnum, bhkEnum, purposeEnum, timelineEnum, sourceEnum, statusEnum } from '@/lib/validations';
import Papa from 'papaparse';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm/expressions';
import { or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

// POST /api/buyers/import - Import buyers from CSV
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }

    let text = await file.text();
    
    // Clean up the CSV text - remove empty lines and trim whitespace
    text = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0) // Remove empty lines
      .map((line, index) => {
        // For data rows (index > 0), ensure we don't have trailing commas
        if (index > 0 && line.endsWith(',')) {
          return line.slice(0, -1);
        }
        return line;
      })
      .join('\n');
    
    // Parse CSV with improved error handling
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value, header) => {
        // Skip if header is empty (can happen with trailing commas)
        if (!header) return undefined;
        
        // Trim all string values
        if (typeof value === 'string') {
          value = value.trim();
          // Convert empty strings to null for optional fields
          if (value === '') return null;
          // Convert numeric strings to numbers for budget fields
          if ((header === 'budgetMin' || header === 'budgetMax') && value) {
            const num = Number(value.replace(/[^0-9.-]+/g, ''));
            return isNaN(num) ? null : num;
          }
          // Convert tags string to array
          if (header === 'tags' && value) {
            return value.split(',').map(tag => tag.trim()).filter(Boolean);
          }
        }
        return value;
      }
    });
    
    // Process each row to clean up the data
    parseResult.data = parseResult.data.map((row: any) => {
      const cleanRow: any = {};
      
      // Only include fields that are defined in our schema
      const schemaFields = ['fullName', 'email', 'phone', 'city', 'propertyType', 'bhk', 
                          'purpose', 'budgetMin', 'budgetMax', 'timeline', 'source', 
                          'status', 'notes', 'tags'];
      
      // Process each field in the row
      Object.entries(row).forEach(([key, value]) => {
        const cleanKey = key.trim();
        
        // Skip empty keys and internal fields
        if (!cleanKey || cleanKey.startsWith('__')) {
          return;
        }
        
        // Only include fields that are in our schema
        if (schemaFields.includes(cleanKey)) {
          // Handle special cases for each field type
          if (value === null || value === undefined || value === '') {
            cleanRow[cleanKey] = undefined;
          } else if (cleanKey === 'tags') {
            // Ensure tags is an array
            if (Array.isArray(value)) {
              cleanRow[cleanKey] = value;
            } else if (typeof value === 'string') {
              cleanRow[cleanKey] = value.split(',').map((t: string) => t.trim()).filter(Boolean);
            } else {
              cleanRow[cleanKey] = [];
            }
          } else if ((cleanKey === 'budgetMin' || cleanKey === 'budgetMax') && value) {
            // Convert budget fields to numbers
            const num = Number(String(value).replace(/[^0-9.-]+/g, ''));
            cleanRow[cleanKey] = isNaN(num) ? undefined : num;
          } else {
            cleanRow[cleanKey] = value;
          }
        }
      });
      
      return cleanRow;
    });

    if (parseResult.errors.length > 0) {
      console.error('CSV parsing errors:', parseResult.errors);
      // Only fail on critical errors, not on field mismatch
      const criticalErrors = parseResult.errors.filter(
        (error: any) => error.type !== 'FieldMismatch' || 
                       (error.type === 'FieldMismatch' && error.code !== 'TooManyFields')
      );
      
      if (criticalErrors.length > 0) {
        return NextResponse.json({ 
          error: 'CSV parsing failed', 
          details: criticalErrors,
          message: 'Error parsing CSV file. Please check the file format and try again.'
        }, { status: 400 });
      }
      
      // For non-critical errors like extra fields, just log them
      console.warn('Non-critical CSV parsing issues:', parseResult.errors);
    }

    const rows = parseResult.data as any[];
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    if (rows.length > 200) {
      return NextResponse.json({ 
        error: 'CSV file too large. Maximum 200 rows allowed.' 
      }, { status: 400 });
    }

    // Validate each row
    const validRows: Array<{
      id: string;
      ownerId: string;
      fullName: string;
      email?: string;
      phone: string;
      city: string;
      propertyType: string;
      bhk?: string;
      purpose: string;
      budgetMin?: number;
      budgetMax?: number;
      timeline: string;
      source: string;
      status: string;
      notes?: string;
      tags: string[];
      createdAt: Date;
      updatedAt: Date;
    }> = [];
    
    const errors: ImportError[] = [];
    const seenPhones = new Set<string>();
    const seenEmails = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because of header row and 0-based index
      let hasError = false;

      try {
        // Transform the row data
        const transformedRow = {
          fullName: String(row.fullName || '').trim(),
          email: row.email ? String(row.email).trim().toLowerCase() : '',
          phone: String(row.phone || '').trim(),
          city: String(row.city || '').trim(),
          propertyType: String(row.propertyType || '').trim(),
          bhk: row.bhk ? String(row.bhk).trim() : undefined,
          purpose: String(row.purpose || '').trim(),
          budgetMin: row.budgetMin ? Number(row.budgetMin) : undefined,
          budgetMax: row.budgetMax ? Number(row.budgetMax) : undefined,
          timeline: String(row.timeline || '').trim(),
          source: String(row.source || '').trim(),
          status: row.status ? String(row.status).trim() : 'New',
          notes: row.notes ? String(row.notes).trim() : '',
          tags: row.tags ? String(row.tags).split(',').map(tag => tag.trim()).filter(Boolean) : [],
        };

        // Check for duplicate phone/email in the current import
        if (transformedRow.phone && seenPhones.has(transformedRow.phone)) {
          throw new Error(`Duplicate phone number in row ${rowNumber}`);
        }
        
        if (transformedRow.email && seenEmails.has(transformedRow.email)) {
          throw new Error(`Duplicate email in row ${rowNumber}`);
        }

        // Validate the row against the schema
        const validatedRow = csvBuyerSchema.parse(transformedRow);
        
        // Check for existing records with the same phone or email
        const existing = await db.query.buyers.findFirst({
          where: or(
            and(eq(buyers.phone, validatedRow.phone), eq(buyers.ownerId, session.user.id)),
            validatedRow.email ? and(eq(buyers.email, validatedRow.email), eq(buyers.ownerId, session.user.id)) : undefined
          )
        });

        if (existing) {
          throw new Error('A buyer with this phone number or email already exists');
        }

        validRows.push({
          ...validatedRow,
          id: uuidv4(),
          ownerId: session.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (error) {
        errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Error processing row',
          data: row
        });
      }
    }

    // Insert valid rows in a transaction
    if (validRows.length > 0) {
      try {
        await db.transaction(async (tx) => {
          // Insert all buyers in a single batch
          await tx.insert(buyers).values(validRows);
          
          // Prepare and insert history entries
          for (const row of validRows) {
            const { id, ...rowData } = row;
            const historyEntry = {
              id: uuidv4(),
              buyerId: id,
              changedBy: session.user.id,
              changedAt: new Date(),
              action: 'create' as const,
              diff: {
                from: {},
                to: rowData
              }
            };
            await tx.insert(buyerHistory).values(historyEntry);
          }
        });
      } catch (error) {
        console.error('Transaction failed:', error);
        throw new Error('Failed to import buyers. Please try again.');
      }
    }

    // Prepare response
    const response = {
      success: errors.length === 0,
      message: errors.length === 0 
        ? `Successfully imported ${validRows.length} ${validRows.length === 1 ? 'row' : 'rows'}`
        : `Imported ${validRows.length} rows with ${errors.length} ${errors.length === 1 ? 'error' : 'errors'}`,
      imported: validRows.length,
      errors: errors.slice(0, 100), // Limit number of errors to prevent response size issues
      validCount: validRows.length,
      totalCount: rows.length,
      hasMoreErrors: errors.length > 100,
    };

    return NextResponse.json(response, {
      status: errors.length === 0 ? 200 : 207, // 207 for partial success
    });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json({ 
      error: 'Import failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
