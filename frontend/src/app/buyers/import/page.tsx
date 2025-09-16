'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Download, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

interface ImportResult {
  success: boolean;
  message: string;
  imported?: number;
  errors: ImportError[];
  validCount?: number;
  totalCount?: number;
}

export default function ImportBuyersPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/buyers/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }
      
      setResult(data);

      if (data.success || data.imported > 0) {
        // Redirect to buyers list after successful import or partial success
        setTimeout(() => {
          router.push('/buyers');
        }, 3000);
      }
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed. Please try again.',
        errors: [],
        imported: 0,
        validCount: 0,
        totalCount: 0,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'fullName',
      'email',
      'phone',
      'city',
      'propertyType',
      'bhk',
      'purpose',
      'budgetMin',
      'budgetMax',
      'timeline',
      'source',
      'notes',
      'tags',
      'status'
    ];

    const sampleData = [
      {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '3',
        purpose: 'Buy',
        budgetMin: '5000000',
        budgetMax: '7000000',
        timeline: '3-6m',
        source: 'Website',
        notes: 'Looking for 3BHK in good locality',
        tags: 'urgent,verified',
        status: 'New'
      }
    ];

    const csvContent = [
      headers.join(','),
      sampleData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row] || '';
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      ).join('\n')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'buyers-import-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/buyers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Buyers
            </Link>
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">Import Buyers</h1>
          <p className="mt-2 text-gray-600">Upload a CSV file to import buyer leads</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                Select a CSV file with buyer data to import (max 200 rows)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">CSV File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                />
              </div>

              {selectedFile && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Import
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={downloadTemplate} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Import Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Required Columns:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <code>fullName</code> - Full name (2-80 characters)</li>
                  <li>• <code>phone</code> - Phone number (10-15 digits)</li>
                  <li>• <code>city</code> - Chandigarh|Mohali|Zirakpur|Panchkula|Other</li>
                  <li>• <code>propertyType</code> - Apartment|Villa|Plot|Office|Retail</li>
                  <li>• <code>purpose</code> - Buy|Rent</li>
                  <li>• <code>timeline</code> - 0-3m|3-6m|&gt;6m|Exploring</li>
                  <li>• <code>source</code> - Website|Referral|Walk-in|Call|Other</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Optional Columns:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <code>email</code> - Valid email address</li>
                  <li>• <code>bhk</code> - Required for Apartment/Villa (1|2|3|4|Studio)</li>
                  <li>• <code>budgetMin</code> - Minimum budget in INR</li>
                  <li>• <code>budgetMax</code> - Maximum budget in INR</li>
                  <li>• <code>notes</code> - Additional notes (max 1000 chars)</li>
                  <li>• <code>tags</code> - Comma-separated tags</li>
                  <li>• <code>status</code> - Defaults to "New"</li>
                </ul>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Tips:</strong>
                  <br />• Download the template to see the correct format
                  <br />• BHK is required for Apartment and Villa properties
                  <br />• Budget max must be ≥ budget min
                  <br />• Maximum 200 rows per import
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4 mb-6">
            <Alert variant={result.success ? 'default' : 'destructive'}> 
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <AlertDescription>
                  {result.message}
                  {result.hasMoreErrors && (
                    <span className="block text-sm text-muted-foreground mt-1">
                      Showing first 100 errors. There are {result.errors.length - 100} more errors not shown.
                    </span>
                  )}
                </AlertDescription>
              </div>
            </Alert>

            {result.errors && result.errors.length > 0 && (
              <div className="border rounded-md p-4 max-h-96 overflow-auto">
                <h4 className="font-medium mb-2">Import Errors</h4>
                <div className="space-y-2">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm p-2 bg-red-50 rounded">
                      <p className="font-medium">Row {error.row}: {error.message}</p>
                      {error.field && (
                        <p className="text-muted-foreground">Field: {error.field}</p>
                      )}
                      {error.data && (
                        <pre className="mt-1 text-xs p-2 bg-white rounded border overflow-x-auto">
                          {JSON.stringify(error.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
                {result.imported > 0 && (
                  <div className="p-4 bg-green-50 rounded-md">
                    <p className="text-green-800 font-medium">
                      ✅ Successfully imported {result.imported} buyers
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      Redirecting to buyers list...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
