import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import path from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const imageFile = formData.get('image') as File | null;

    let imagePath = session.user.image || null;
    
    if (imageFile) {
      // Create uploads directory if it doesn't exist
      await fs.mkdir(uploadDir, { recursive: true });
      
      const ext = path.extname(imageFile.name);
      const filename = `${uuidv4()}${ext}`;
      imagePath = `/uploads/${filename}`;
      
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.writeFile(path.join(uploadDir, filename), buffer);
    }

    // Update user in database
    await db
      .update(users)
      .set({
        name,
        ...(imagePath && { image: imagePath })
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ 
      name, 
      image: imagePath 
    });
    
  } catch (error) {
    console.error('Profile update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
