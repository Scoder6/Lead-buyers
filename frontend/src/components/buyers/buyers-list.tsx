'use client';

import { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Eye, 
  Edit, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Upload,
  MoreHorizontal,
  Plus,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { formatBudgetRange, formatDate } from '@/lib/utils';
import type { SearchParams } from '@/lib/validations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface BuyersListProps {
  buyers: Buyer[];
  pagination: Pagination;
  currentFilters: SearchParams;
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

const sortOptions = [
  { value: 'fullName-asc', label: 'Name (A-Z)' },
  { value: 'fullName-desc', label: 'Name (Z-A)' },
  { value: 'budgetMin-asc', label: 'Budget (Low to High)' },
  { value: 'budgetMax-desc', label: 'Budget (High to Low)' },
  { value: 'updatedAt-desc', label: 'Last Updated (Newest)' },
  { value: 'updatedAt-asc', label: 'Last Updated (Oldest)' },
];

export default function BuyersList({ buyers, pagination, currentFilters }: BuyersListProps) {
  const [localBuyers, setLocalBuyers] = useState<Buyer[]>(buyers);
  const [optimisticFilters, setOptimisticFilters] = useState(currentFilters);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  
  // Update local buyers when props change
  useEffect(() => {
    setLocalBuyers(buyers);
  }, [buyers]);

  const handleFilterChange = useCallback((key: keyof typeof currentFilters, value: string) => {
    // Update local state immediately
    const newFilters = {...optimisticFilters, [key]: value || undefined};
    setOptimisticFilters(newFilters);
    
    // Debounce URL update with transition
    const timeout = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams();
        
        // Preserve existing page parameter
        const currentPage = searchParams.get('page') || '1';
        params.set('page', currentPage);
        
        // Apply all filters
        Object.entries(newFilters).forEach(([k, v]) => {
          if (v) params.set(k, String(v));
        });
        
        router.replace(`/buyers?${params.toString()}`, {
          scroll: false,
          shallow: true
        });
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [router, optimisticFilters, searchParams]);

  // Status quick actions
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/buyers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id,
          status: newStatus,
          updatedAt: new Date().toISOString() 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Optimistically update local state
      setLocalBuyers(prev => 
        prev.map(buyer => 
          buyer.id === id ? { ...buyer, status: newStatus } : buyer
        )
      );
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  // Memoize filtered buyers to prevent unnecessary re-renders
  const filteredBuyers = useMemo(() => {
    return localBuyers;
  }, [localBuyers]);

  const updatePage = (newPage: number) => {
    setIsLoading(true);
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/buyers?${params.toString()}`)
      .then(() => setIsLoading(false))
      .catch(() => setIsLoading(false));
  };

  const updateSort = (sortBy: string, sortOrder: string) => {
    setIsLoading(true);
    const params = new URLSearchParams(searchParams);
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    params.set('page', '1'); // Reset to first page
    router.push(`/buyers?${params.toString()}`)
      .then(() => setIsLoading(false))
      .catch(() => setIsLoading(false));
  };

  const exportToCSV = async () => {
    setIsLoading(true);
    try {
      // Use the export API endpoint with current filters
      const params = new URLSearchParams(searchParams);
      const response = await fetch(`/api/buyers/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `buyers-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSortIcon = (column: string) => {
    if (currentFilters.sortBy === column) {
      return currentFilters.sortOrder === 'asc' ? '↑' : '↓';
    }
    return '';
  };

  return (
    <div className={`transition-opacity duration-200 ${isPending ? 'opacity-75' : 'opacity-100'}`}>
      {/* Add loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
      
      {/* Header with actions */}
      <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-between items-start sm:items-center mb-4 px-2 sm:px-0">
        <div className="text-sm text-gray-600 whitespace-nowrap">
          <p>
            Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-medium">{pagination.total}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 sm:flex-initial justify-center px-2 sm:px-3" 
            asChild
            title="Import from CSV"
          >
            <Link href="/buyers/import" className="flex items-center">
              <Upload className="h-4 w-4 sm:mr-1" />
              <span className="sr-only sm:not-sr-only">Import</span>
            </Link>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 sm:flex-initial justify-center px-2 sm:px-3" 
            asChild
            title="Add new lead"
          >
            <Link href="/buyers/new" className="flex items-center">
              <Plus className="h-4 w-4 sm:mr-1" />
              <span className="sr-only sm:not-sr-only">Add Lead</span>
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 sm:flex-initial justify-center px-2 sm:px-3" 
            onClick={exportToCSV}
            disabled={isLoading}
            title="Export to CSV"
          >
            <Download className="h-4 w-4 sm:mr-1" />
            <span className="sr-only sm:not-sr-only">
              {isLoading ? 'Exporting...' : 'Export'}
            </span>
          </Button>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center mb-4">
        <span className="text-sm font-medium whitespace-nowrap">Sort by:</span>
        <div className="w-full sm:w-48">
          <Select 
            value={`${currentFilters.sortBy}-${currentFilters.sortOrder}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-');
              updateSort(sortBy, sortOrder);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Buyers List */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-lg shadow-sm border">
        <div className="w-full overflow-auto flex-1">
          {filteredBuyers.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-gray-500 mb-4">No buyers found matching your criteria.</p>
                <Button asChild>
                  <Link href="/buyers/new">Create your first lead</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="transition-opacity duration-200">
              {/* Desktop Table View */}
              <div className={`transition-opacity duration-200 ${isPending ? 'opacity-75' : 'opacity-100'}`}>

              <div className="hidden md:block w-full overflow-auto">
                <table className="min-w-full divide-y divide-gray-200" aria-label="Buyers list">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => updateSort('fullName', currentFilters.sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="flex items-center gap-1 hover:text-gray-700 w-full text-left"
                          aria-label="Sort by name"
                          aria-sort={currentFilters.sortBy === 'fullName' ? 
                            (currentFilters.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'
                          }
                        >
                          <span>Name</span>
                          <span>{getSortIcon('fullName')}</span>
                        </button>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Budget
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timeline
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => updateSort('updatedAt', currentFilters.sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="flex items-center gap-1 hover:text-gray-700 w-full text-right justify-end"
                          aria-label="Sort by last updated"
                          aria-sort={currentFilters.sortBy === 'updatedAt' ? 
                            (currentFilters.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'
                          }
                        >
                          <span>Last Updated</span>
                          <span>{getSortIcon('updatedAt')}</span>
                        </button>
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBuyers.map((buyer) => (
                      <tr key={buyer.id} className="hover:bg-gray-50" aria-label={`Buyer ${buyer.fullName}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                <Link 
                                  href={`/buyers/${buyer.id}`}
                                  className="hover:text-primary hover:underline"
                                >
                                  {buyer.fullName}
                                </Link>
                              </div>
                              <div className="text-sm text-gray-500">
                                {buyer.email || 'No email'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{buyer.phone}</div>
                          <div className="text-sm text-gray-500">{buyer.city}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {buyer.propertyType} {buyer.bhk ? `(${buyer.bhk})` : ''}
                          </div>
                          <div className="text-sm text-gray-500">{buyer.purpose}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatBudgetRange(buyer.budgetMin, buyer.budgetMax)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {buyer.timeline}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              statusColors[buyer.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {buyer.status}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger>
                                <MoreHorizontal className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => updateStatus(buyer.id, 'New')}
                                  className="flex items-center gap-2"
                                >
                                  <Clock className="h-4 w-4" />
                                  Mark as New
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateStatus(buyer.id, 'Qualified')}
                                  className="flex items-center gap-2"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  Mark as Qualified
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateStatus(buyer.id, 'Dropped')}
                                  className="flex items-center gap-2"
                                >
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  Mark as Dropped
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(buyer.updatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link 
                              href={`/buyers/${buyer.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link 
                              href={`/buyers/${buyer.id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {filteredBuyers.map((buyer) => (
                  <Card key={buyer.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          <Link href={`/buyers/${buyer.id}`} className="hover:text-primary hover:underline">
                            {buyer.fullName}
                          </Link>
                        </CardTitle>
                        <div className="flex space-x-2">
                          <Link href={`/buyers/${buyer.id}/edit`} title="Edit">
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Link>
                          <Link href={`/buyers/${buyer.id}`} title="View">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge className={statusColors[buyer.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                          {buyer.status}
                        </Badge>
                        <Badge variant="secondary">
                          {buyer.timeline}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Phone</p>
                          <p>{buyer.phone}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">City</p>
                          <p>{buyer.city}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Property</p>
                          <p>{buyer.propertyType} {buyer.bhk ? `(${buyer.bhk})` : ''}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Budget</p>
                          <p>{formatBudgetRange(buyer.budgetMin, buyer.budgetMax)}</p>
                        </div>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground">Last Updated</p>
                        <p>{formatDate(buyer.updatedAt)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => updatePage(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    // Calculate page numbers with current page in the middle when possible
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => updatePage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === pageNum
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => updatePage(Math.min(pagination.pages, pagination.page + 1))}
                    disabled={pagination.page === pagination.pages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === pagination.pages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
