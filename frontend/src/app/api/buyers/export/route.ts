import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { buyers } from '@/lib/schema';
import { and, eq, ilike, or } from 'drizzle-orm';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/lib/schema';

export async function GET(request: NextRequest) {
  // Create fresh database connection
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client, { schema });
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Build query conditions
    const conditions = [eq(buyers.ownerId, session.user.id)];
    
    if (searchParams.get('query')) {
      conditions.push(
        or(
          ilike(buyers.fullName, `%${searchParams.get('query')}%`),
          ilike(buyers.email, `%${searchParams.get('query')}%`),
          ilike(buyers.phone, `%${searchParams.get('query')}%`)
        )
      );
    }
    
    // Execute fresh query
    const buyersData = await db.select().from(buyers).where(and(...conditions));

    // Generate CSV
    const headers = ['fullName', 'email', 'phone', 'city', 'propertyType', 'bhk', 
                    'purpose', 'budgetMin', 'budgetMax', 'timeline', 'source', 
                    'status', 'notes', 'tags', 'createdAt', 'updatedAt'];
    
    const csvRows = buyersData.map(buyer => 
      headers.map(header => {
        const value = buyer[header as keyof typeof buyer] ?? '';
        const strValue = Array.isArray(value) ? value.join(',') : String(value);
        return /[",\n]/.test(strValue) ? `"${strValue.replace(/"/g, '""')}"` : strValue;
      })
    );
    
    csvRows.unshift(headers);
    const csvContent = csvRows.map(row => row.join(',')).join('\n');

    // Create response with no-cache headers
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=buyers-${Date.now()}.csv`,
        'Cache-Control': 'no-store, max-age=0'
      }
    });
    
  } finally {
    await client.end();
  }
}
