import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { buyers, buyerHistory, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import BuyerDetails from '@/components/buyers/buyer-details';
import BuyerHistory from '@/components/buyers/buyer-history';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: { id: string };
}

async function getBuyerWithHistory(id: string) {
  // Get buyer details
  const [buyer] = await db
    .select()
    .from(buyers)
    .where(eq(buyers.id, id));

  if (!buyer) {
    return null;
  }

  // Get history with user details
  const history = await db
    .select({
      id: buyerHistory.id,
      changedAt: buyerHistory.changedAt,
      diff: buyerHistory.diff,
      changedBy: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(buyerHistory)
    .leftJoin(users, eq(buyerHistory.changedBy, users.id))
    .where(eq(buyerHistory.buyerId, id))
    .orderBy(desc(buyerHistory.changedAt))
    .limit(5);

  return { buyer, history };
}

export default async function BuyerDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  const data = await getBuyerWithHistory(params.id);
  
  if (!data) {
    notFound();
  }

  const { buyer, history } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/buyers">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Buyers
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{buyer.fullName}</h1>
                <p className="mt-2 text-gray-600">
                  Lead Details
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              {buyer.ownerId === session.user.id && (
                <Button asChild>
                  <Link href={`/buyers/${buyer.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Lead
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2">
            <Suspense fallback={<div>Loading buyer details...</div>}>
              <BuyerDetails buyer={buyer} />
            </Suspense>
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">
            <Suspense fallback={<div>Loading history...</div>}>
              <BuyerHistory history={history} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
