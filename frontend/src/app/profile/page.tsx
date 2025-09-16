'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface UserProfile {
  name: string;
  email: string;
  image: string | null;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    image: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || '',
        email: session.user.email || '',
        image: session.user.image || null
      });
      if (session.user.image) {
        setPreviewUrl(session.user.image);
      }
    }
  }, [session]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email) return;

    setIsLoading(true);
    
    try {
      // Upload image first if selected
      let imageUrl = profile.image;
      
      if (selectedFile) {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: (() => {
            const formData = new FormData();
            formData.append('file', selectedFile);
            return formData;
          })(),
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || 'Failed to upload image');
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to process image');
        }
        
        imageUrl = data.url;
      }

      // Update profile
      const updatedProfile = {
        ...profile,
        image: imageUrl
      };

      // Update the session with the new profile data
      await update({
        user: {
          ...session?.user,
          name: updatedProfile.name,
          email: updatedProfile.email,
          image: updatedProfile.image
        }
      });

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            Update your profile information and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-2 border-gray-200">
                    <AvatarImage 
                      src={previewUrl || ''} 
                      alt={profile.name || 'User'} 
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gray-100 text-gray-500 text-2xl font-medium">
                      {profile.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <label 
                      className={`absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md cursor-pointer transition-all ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 hover:shadow-lg'
                      }`}
                      title="Change photo"
                    >
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isLoading}
                      />
                      {isLoading ? (
                        <div className="h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                    </label>
                  )}
                </div>
                <h2 className="text-xl font-semibold">{profile.name}</h2>
                <p className="text-gray-500">{profile.email}</p>
              </div>
            </div>

            {isEditing ? (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={profile.name || ''}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email || ''}
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset to original values
                      if (session.user) {
                        setProfile({
                          name: session.user.name || '',
                          email: session.user.email || '',
                          image: session.user.image || ''
                        });
                        setSelectedFile(null);
                        setPreviewUrl(session.user.image || null);
                      }
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex justify-end pt-4">
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              </div>
            )}
          </form>

          <div className="mt-8 pt-6 border-t">
            <h3 className="font-medium text-destructive">Danger Zone</h3>
            <p className="text-sm text-gray-500 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button
              variant="destructive"
              onClick={() => signOut({ callbackUrl: '/' })}
              disabled={isLoading}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
