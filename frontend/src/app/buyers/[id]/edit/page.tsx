'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateBuyerSchema, type UpdateBuyer } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

const cityOptions = ['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other'];
const propertyTypeOptions = ['Apartment', 'Villa', 'Plot', 'Office', 'Retail'];
const bhkOptions = ['1', '2', '3', '4', 'Studio'];
const purposeOptions = ['Buy', 'Rent'];
const timelineOptions = ['0-3m', '3-6m', '>6m', 'Exploring'];
const sourceOptions = ['Website', 'Referral', 'Walk-in', 'Call', 'Other'];
const statusOptions = ['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped'];

interface PageProps {
  params: { id: string };
}

export default function EditBuyerPage({ params }: PageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [buyer, setBuyer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateBuyer>({
    resolver: zodResolver(updateBuyerSchema),
  });

  const propertyType = watch('propertyType');
  const requiresBHK = propertyType === 'Apartment' || propertyType === 'Villa';

  // Fetch buyer data
  useEffect(() => {
    const fetchBuyer = async () => {
      try {
        const response = await fetch(`/api/buyers/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch buyer');
        }
        const data = await response.json();
        setBuyer(data.buyer);
        
        // Reset form with buyer data
        reset({
          ...data.buyer,
          updatedAt: data.buyer.updatedAt,
        });
        
        setTags(data.buyer.tags || []);
        setValue('tags', data.buyer.tags || []);
      } catch (err) {
        setError('Failed to load buyer data');
      } finally {
        setLoading(false);
      }
    };

    fetchBuyer();
  }, [params.id, reset, setValue]);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    setValue('tags', newTags);
  };

  const onSubmit = async (data: UpdateBuyer) => {
    setIsLoading(true);
    setError('');

    try {
      // Check if record has been modified
      if (data.updatedAt !== buyer.updatedAt.toISOString()) {
        throw new Error('Record has been modified by another user. Please refresh the page.');
      }

      const response = await fetch(`/api/buyers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update buyer');
      }

      router.push(`/buyers/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this buyer? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/buyers/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete buyer');
      }

      router.push('/buyers');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete buyer');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!buyer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Buyer not found</h1>
          <Button asChild>
            <Link href="/buyers">Back to Buyers</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/buyers/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Details
            </Link>
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">Edit Lead</h1>
          <p className="mt-2 text-gray-600">Update buyer information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buyer Information</CardTitle>
            <CardDescription>
              Update the details for this buyer lead
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Hidden field for concurrency control */}
              <input type="hidden" {...register('updatedAt')} />

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    {...register('fullName')}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-600">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Select value={watch('city')} onValueChange={(value) => setValue('city', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cityOptions.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.city && (
                    <p className="text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select value={watch('propertyType')} onValueChange={(value) => setValue('propertyType', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypeOptions.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.propertyType && (
                    <p className="text-sm text-red-600">{errors.propertyType.message}</p>
                  )}
                </div>

                {requiresBHK && (
                  <div className="space-y-2">
                    <Label htmlFor="bhk">BHK *</Label>
                    <Select value={watch('bhk')} onValueChange={(value) => setValue('bhk', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select BHK" />
                      </SelectTrigger>
                      <SelectContent>
                        {bhkOptions.map((bhk) => (
                          <SelectItem key={bhk} value={bhk}>
                            {bhk}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.bhk && (
                      <p className="text-sm text-red-600">{errors.bhk.message}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose *</Label>
                  <Select value={watch('purpose')} onValueChange={(value) => setValue('purpose', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {purposeOptions.map((purpose) => (
                        <SelectItem key={purpose} value={purpose}>
                          {purpose}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.purpose && (
                    <p className="text-sm text-red-600">{errors.purpose.message}</p>
                  )}
                </div>
              </div>

              {/* Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetMin">Minimum Budget (INR)</Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    {...register('budgetMin', { valueAsNumber: true })}
                    placeholder="Enter minimum budget"
                  />
                  {errors.budgetMin && (
                    <p className="text-sm text-red-600">{errors.budgetMin.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budgetMax">Maximum Budget (INR)</Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    {...register('budgetMax', { valueAsNumber: true })}
                    placeholder="Enter maximum budget"
                  />
                  {errors.budgetMax && (
                    <p className="text-sm text-red-600">{errors.budgetMax.message}</p>
                  )}
                </div>
              </div>

              {/* Timeline and Source */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline *</Label>
                  <Select value={watch('timeline')} onValueChange={(value) => setValue('timeline', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {timelineOptions.map((timeline) => (
                        <SelectItem key={timeline} value={timeline}>
                          {timeline}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.timeline && (
                    <p className="text-sm text-red-600">{errors.timeline.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Source *</Label>
                  <Select value={watch('source')} onValueChange={(value) => setValue('source', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceOptions.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.source && (
                    <p className="text-sm text-red-600">{errors.source.message}</p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={watch('status')} onValueChange={(value) => setValue('status', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Add any additional notes..."
                  rows={4}
                />
                {errors.notes && (
                  <p className="text-sm text-red-600">{errors.notes.message}</p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Lead
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/buyers/${params.id}`}>Cancel</Link>
                </Button>
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
