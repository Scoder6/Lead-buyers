'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Upload } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  image: z.any().optional()
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileEditPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || '',
    }
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.image?.[0]) {
        formData.append('image', data.image[0]);
      }

      const response = await fetch('/api/profile', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const updatedUser = await response.json();
        await update({
          ...session,
          user: {
            ...session?.user,
            name: updatedUser.name,
            image: updatedUser.image
          }
        });
        router.push('/profile');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {session?.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'Profile'} 
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className="h-24 w-24 text-gray-400" />
                  )}
                </div>
                <div>
                  <Label htmlFor="image" className="flex items-center gap-2 cursor-pointer">
                    <Upload className="h-4 w-4" />
                    <span>Upload Photo</span>
                    <Input 
                      id="image" 
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      {...register('image')}
                    />
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
