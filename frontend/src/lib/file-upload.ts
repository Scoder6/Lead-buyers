import { v4 as uuidv4 } from 'uuid';

// For development - stores files in memory
const fileStore = new Map<string, { data: Buffer; type: string }>();

// For production - uses AWS S3
const useS3 = process.env.NODE_ENV === 'production' && 
              process.env.AWS_ACCESS_KEY_ID && 
              process.env.AWS_SECRET_ACCESS_KEY &&
              process.env.AWS_S3_BUCKET_NAME;

export async function uploadFile(file: File): Promise<{ url: string; key: string }> {
  if (useS3) {
    return uploadToS3(file);
  } else {
    return uploadLocally(file);
  }
}

async function uploadLocally(file: File): Promise<{ url: string; key: string }> {
  const fileKey = `uploads/${uuidv4()}-${file.name}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  fileStore.set(fileKey, {
    data: buffer,
    type: file.type,
  });

  // In a real app, you'd want to serve these files through an API route
  const url = `/api/uploads/${fileKey}`;
  
  return { url, key: fileKey };
}

// This would be called from an API route to serve the file
export function getLocalFile(key: string) {
  return fileStore.get(key);
}

// AWS S3 implementation
async function uploadToS3(file: File): Promise<{ url: string; key: string }> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const fileKey = `uploads/${uuidv4()}-${file.name}`;
  const arrayBuffer = await file.arrayBuffer();
  
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileKey,
      Body: Buffer.from(arrayBuffer),
      ContentType: file.type,
    })
  );

  const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
  return { url, key: fileKey };
}
