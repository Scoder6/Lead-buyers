import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { buyers, buyerHistory, users } from '@/lib/schema';
import { updateBuyerSchema } from '@/lib/validations';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { check, RATE_LIMITS } from '@/lib/rateLimit';

// GET /api/buyers/[id] - Get single buyer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [buyer] = await db
      .select()
      .from(buyers)
      .where(eq(buyers.id, params.id));

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    // Get history
    const history = await db
      .select({
        id: buyerHistory.id,
        changedAt: buyerHistory.changedAt,
        diff: buyerHistory.diff,
        changedBy: buyerHistory.changedBy,
      })
      .from(buyerHistory)
      .where(eq(buyerHistory.buyerId, params.id))
      .orderBy(desc(buyerHistory.changedAt))
      .limit(5);

    return NextResponse.json({ buyer, history });
  } catch (error) {
    console.error('GET /api/buyers/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/buyers/[id] - Update buyer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimit = await check(request, 'UPDATE_BUYER');
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
    const validatedData = updateBuyerSchema.parse(body);

    // Get current buyer for ownership check and concurrency control
    const [currentBuyer] = await db
      .select()
      .from(buyers)
      .where(eq(buyers.id, params.id));

    if (!currentBuyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    // Check ownership
    if (currentBuyer.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check concurrency (optimistic locking)
    if (currentBuyer.updatedAt.toISOString() !== validatedData.updatedAt) {
      return NextResponse.json({ 
        error: 'Record has been modified by another user. Please refresh and try again.' 
      }, { status: 409 });
    }

    // Calculate diff for history
    const diff: Record<string, { from: any; to: any }> = {};
    Object.keys(validatedData).forEach(key => {
      if (key !== 'id' && key !== 'updatedAt' && currentBuyer[key as keyof typeof currentBuyer] !== validatedData[key as keyof typeof validatedData]) {
        diff[key] = {
          from: currentBuyer[key as keyof typeof currentBuyer],
          to: validatedData[key as keyof typeof validatedData],
        };
      }
    });

    // Update buyer
    const [updatedBuyer] = await db
      .update(buyers)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(buyers.id, params.id))
      .returning();

    // Create history entry if there are changes
    if (Object.keys(diff).length > 0) {
      await db.insert(buyerHistory).values({
        buyerId: params.id,
        changedBy: session.user.id,
        diff,
      });
    }

    return NextResponse.json(updatedBuyer);
  } catch (error) {
    console.error('PUT /api/buyers/[id] error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/buyers/[id] - Delete buyer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current buyer for ownership check
    const [currentBuyer] = await db
      .select()
      .from(buyers)
      .where(eq(buyers.id, params.id));

    if (!currentBuyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    // Check ownership
    if (currentBuyer.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete buyer (history will be cascade deleted)
    await db.delete(buyers).where(eq(buyers.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/buyers/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
