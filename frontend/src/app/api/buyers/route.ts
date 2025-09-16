import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { buyers, buyerHistory } from '@/lib/schema';
import { createBuyerSchema, searchSchema } from '@/lib/validations';
import { eq, and, or, ilike, desc, asc, count } from 'drizzle-orm';
import { z } from 'zod';
import { check, RATE_LIMITS } from '@/lib/rateLimit';

// GET /api/buyers - List buyers with search/filter
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    // Convert string params to proper types
    const parsedParams = {
      ...params,
      page: params.page ? parseInt(params.page) : 1,
      limit: params.limit ? parseInt(params.limit) : 10,
    };

    const validatedParams = searchSchema.parse(parsedParams);

    // Build where conditions
    const conditions = [];
    
    if (validatedParams.query) {
      conditions.push(
        or(
          ilike(buyers.fullName, `%${validatedParams.query}%`),
          ilike(buyers.email, `%${validatedParams.query}%`),
          ilike(buyers.phone, `%${validatedParams.query}%`)
        )
      );
    }

    if (validatedParams.city) {
      conditions.push(eq(buyers.city, validatedParams.city));
    }

    if (validatedParams.propertyType) {
      conditions.push(eq(buyers.propertyType, validatedParams.propertyType));
    }

    if (validatedParams.status) {
      conditions.push(eq(buyers.status, validatedParams.status));
    }

    if (validatedParams.timeline) {
      conditions.push(eq(buyers.timeline, validatedParams.timeline));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(buyers)
      .where(whereClause);

    const total = totalResult.count;

    // Get paginated results
    const orderBy = validatedParams.sortOrder === 'asc' 
      ? asc(buyers[validatedParams.sortBy])
      : desc(buyers[validatedParams.sortBy]);

    const results = await db
      .select()
      .from(buyers)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(validatedParams.limit)
      .offset((validatedParams.page - 1) * validatedParams.limit);

    return NextResponse.json({
      data: results,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total,
        pages: Math.ceil(total / validatedParams.limit),
      },
    });
  } catch (error) {
    console.error('GET /api/buyers error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/buyers - Create new buyer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimit = await check(request, 'CREATE_BUYER');
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          }
        }
      );
    }

    const body = await request.json();
    const validatedData = createBuyerSchema.parse(body);

    // Create buyer
    const [newBuyer] = await db
      .insert(buyers)
      .values({
        ...validatedData,
        ownerId: session.user.id,
      })
      .returning();

    // Create history entry
    await db.insert(buyerHistory).values({
      buyerId: newBuyer.id,
      changedBy: session.user.id,
      diff: { created: { from: null, to: 'New buyer created' } },
    });

    return NextResponse.json(newBuyer, { status: 201 });
  } catch (error) {
    console.error('POST /api/buyers error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
