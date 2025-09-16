'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatBudgetRange, formatDate } from '@/lib/utils';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Home, 
  Calendar, 
  DollarSign, 
  Target, 
  Tag,
  FileText,
  Clock
} from 'lucide-react';

interface Buyer {
  id: string;
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
}

interface HistoryItem {
  id: string;
  changedAt: Date;
  diff: Record<string, { from: any; to: any }>;
  changedBy: {
    id: string;
    name?: string;
    email?: string;
  };
}

interface BuyerDetailsProps {
  buyer: Buyer;
  history?: HistoryItem[];
}

const statusColors = {
  New: 'bg-blue-100 text-blue-800',
  Qualified: 'bg-green-100 text-green-800',
  Contacted: 'bg-yellow-100 text-yellow-800',
  Visited: 'bg-purple-100 text-purple-800',
  Negotiation: 'bg-orange-100 text-orange-800',
  Converted: 'bg-emerald-100 text-emerald-800',
  Dropped: 'bg-red-100 text-red-800',
};

export default function BuyerDetails({ buyer, history }: BuyerDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-sm text-gray-900">{buyer.fullName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-sm text-gray-900">{buyer.phone}</p>
              </div>
            </div>
            
            {buyer.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{buyer.email}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">City</p>
                <p className="text-sm text-gray-900">{buyer.city}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Property Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Home className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Property Type</p>
                <p className="text-sm text-gray-900">{buyer.propertyType}</p>
              </div>
            </div>
            
            {buyer.bhk && (
              <div className="flex items-center gap-3">
                <Home className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">BHK</p>
                  <p className="text-sm text-gray-900">{buyer.bhk}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <Target className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Purpose</p>
                <p className="text-sm text-gray-900">{buyer.purpose}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Budget</p>
                <p className="text-sm text-gray-900">
                  {formatBudgetRange(buyer.budgetMin, buyer.budgetMax)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Lead Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Timeline</p>
                <p className="text-sm text-gray-900">{buyer.timeline}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Target className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Source</p>
                <p className="text-sm text-gray-900">{buyer.source}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <Badge className={statusColors[buyer.status as keyof typeof statusColors]}>
                  {buyer.status}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-sm text-gray-900">{formatDate(buyer.createdAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      {buyer.tags && buyer.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {buyer.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {buyer.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{buyer.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Change History
            </CardTitle>
            <CardDescription>
              Last {history.length} changes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="border-l-2 border-gray-200 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {item.changedBy.name || item.changedBy.email || 'System'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(item.changedAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {Object.entries(item.diff).map(([field, {from, to}]) => (
                    <p key={field} className="text-sm">
                      <span className="font-medium capitalize">{field}</span>: 
                      <span className="text-gray-500 line-through mx-1">{String(from)}</span>
                      →
                      <span className="text-gray-900 ml-1">{String(to)}</span>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
