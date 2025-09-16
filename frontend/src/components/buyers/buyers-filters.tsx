'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, X, Filter } from 'lucide-react';
import { debounce } from '@/lib/utils';
import type { SearchParams } from '@/lib/validations';

const cityOptions = ['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other'];
const propertyTypeOptions = ['Apartment', 'Villa', 'Plot', 'Office', 'Retail'];
const statusOptions = ['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped'];
const timelineOptions = ['0-3m', '3-6m', '>6m', 'Exploring'];

interface BuyersFiltersProps {
  initialFilters: SearchParams;
}

export default function BuyersFilters({ initialFilters }: BuyersFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(initialFilters.query || '');
  const [city, setCity] = useState<string | undefined>(initialFilters.city || undefined);
  const [propertyType, setPropertyType] = useState<string | undefined>(initialFilters.propertyType || undefined);
  const [status, setStatus] = useState<string | undefined>(initialFilters.status || undefined);
  const [timeline, setTimeline] = useState<string | undefined>(initialFilters.timeline || undefined);

  // Debounced search function
  const debouncedSearch = debounce((searchQuery: string) => {
    updateFilters({ query: searchQuery });
  }, 300);

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const updateFilters = (newFilters: Partial<SearchParams>) => {
    const params = new URLSearchParams(searchParams);
    
    // Update or remove parameters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    if (Object.keys(newFilters).some(key => key !== 'page')) {
      params.set('page', '1');
    }

    router.push(`/buyers?${params.toString()}`);
  };

  const clearFilters = () => {
    setQuery('');
    setCity(undefined);
    setPropertyType(undefined);
    setStatus(undefined);
    setTimeline(undefined);
    router.push('/buyers');
  };

  const hasActiveFilters = query || city !== undefined || propertyType !== undefined || status !== undefined || timeline !== undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Search & Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="search"
              placeholder="Search by name, phone, or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Select value={city || 'all'} onValueChange={(value) => {
              const newValue = value === 'all' ? undefined : value;
              setCity(newValue);
              updateFilters({ city: newValue });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                {cityOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertyType">Property Type</Label>
            <Select value={propertyType || 'all'} onValueChange={(value) => {
              const newValue = value === 'all' ? undefined : value;
              setPropertyType(newValue);
              updateFilters({ propertyType: newValue });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {propertyTypeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status || 'all'} onValueChange={(value) => {
              const newValue = value === 'all' ? undefined : value;
              setStatus(newValue);
              updateFilters({ status: newValue });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline">Timeline</Label>
            <Select value={timeline || 'all'} onValueChange={(value) => {
              const newValue = value === 'all' ? undefined : value;
              setTimeline(newValue);
              updateFilters({ timeline: newValue });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All timelines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All timelines</SelectItem>
                {timelineOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={clearFilters} size="sm">
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
