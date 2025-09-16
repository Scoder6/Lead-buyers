'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Clock, User } from 'lucide-react';

interface HistoryEntry {
  id: string;
  changedAt: Date;
  diff: Record<string, { from: any; to: any }>;
  changedBy: {
    id: string;
    name?: string;
    email: string;
  };
}

interface BuyerHistoryProps {
  history: HistoryEntry[];
}

const fieldLabels: Record<string, string> = {
  fullName: 'Full Name',
  email: 'Email',
  phone: 'Phone',
  city: 'City',
  propertyType: 'Property Type',
  bhk: 'BHK',
  purpose: 'Purpose',
  budgetMin: 'Minimum Budget',
  budgetMax: 'Maximum Budget',
  timeline: 'Timeline',
  source: 'Source',
  status: 'Status',
  notes: 'Notes',
  tags: 'Tags',
};

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'Not set';
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'None';
  }
  if (typeof value === 'number') {
    return value.toLocaleString('en-IN');
  }
  return String(value);
}

export default function BuyerHistory({ history }: BuyerHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Changes
        </CardTitle>
        <CardDescription>
          Last 5 changes to this lead
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {history.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No changes recorded yet
          </p>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div key={entry.id} className="border-l-2 border-gray-200 pl-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-gray-400" />
                    <span className="text-xs font-medium text-gray-600">
                      {entry.changedBy.name || entry.changedBy.email}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(entry.changedAt)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(entry.diff).map(([field, change]) => (
                    <div key={field} className="text-xs">
                      <span className="font-medium text-gray-700">
                        {fieldLabels[field] || field}:
                      </span>
                      <div className="ml-2 space-y-1">
                        {change.from !== null && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-red-600 border-red-200">
                              From: {formatValue(change.from)}
                            </Badge>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            To: {formatValue(change.to)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
