import { NextResponse } from 'next/server';
import { getLocalFile } from '@/lib/file-upload';

export async function GET(
  request: Request,
  { params }: { params: { key: string } }
) {
  try {
    const file = getLocalFile(params.key);
    if (!file) {
      return new NextResponse('File not found', { status: 404 });
    }

    return new NextResponse(file.data, {
      headers: {
        'Content-Type': file.type,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
