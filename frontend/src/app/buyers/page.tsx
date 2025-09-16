import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { buyers } from '@/lib/schema';
import { eq, and, or, ilike, desc, asc, count } from 'drizzle-orm';
import { searchSchema } from '@/lib/validations';
import BuyersList from '@/components/buyers/buyers-list';
import BuyersFilters from '@/components/buyers/buyers-filters';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import Link from 'next/link';

type Buyer = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  city: string;
  propertyType: string;
  bhk: string | null;
  minBudget: number | null;
  maxBudget: number | null;
  purpose: string | null;
  timeline: string | null;
  source: string | null;
  status: string | null;
  notes: string | null;
  tags: string[] | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

interface PageProps {
  searchParams: {
    query?: string;
    city?: string;
    propertyType?: string;
    status?: string;
    timeline?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

async function getBuyers(searchParams: PageProps['searchParams']) {
  // Parse and validate search parameters
  const params = {
    ...searchParams,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: searchParams.limit ? parseInt(searchParams.limit) : 10,
  };

  const validatedParams = searchSchema.parse(params);

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

  return {
    data: results,
    pagination: {
      page: validatedParams.page,
      limit: validatedParams.limit,
      total,
      pages: Math.ceil(total / validatedParams.limit),
    },
    filters: validatedParams,
  };
}

export default async function BuyersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  
  console.log('BuyersPage - session:', !!session, session?.user?.email);
  
  if (!session) {
    console.log('No session found, redirecting to signin');
    redirect('/auth/signin');
  }

  const { data, pagination, filters } = await getBuyers(searchParams) as { 
    data: Buyer[]; 
    pagination: { total: number; page: number; limit: number; totalPages: number }; 
    filters: Record<string, string> 
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
          <div className="space-y-6 h-full flex flex-col">
            <BuyersFilters initialFilters={filters as any} />
            <Suspense fallback={
              <div className="flex-1 flex items-center justify-center">
                <div className="py-12 text-center text-muted-foreground">Loading buyers...</div>
              </div>
            }>
              <div className="flex-1 overflow-hidden flex flex-col">
                <BuyersList 
                  buyers={data as any} 
                  pagination={{
                    ...pagination,
                    pages: pagination.totalPages,
                  }}
                  currentFilters={filters as any}
                />
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
