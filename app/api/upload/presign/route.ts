import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { formatFileName } from '@/utils/utils';
import {
  MAX_FILE_SIZE,
  UPLOAD_TIMEOUT_SEC,
  ALLOWED_AUDIO_TYPES,
} from '@/config/constants';

export async function POST(request: NextRequest) {
  if (!process.env.AWS_BUCKET_NAME) {
    throw new Error('AWS_BUCKET_NAME is not set');
  }

  if (!process.env.AWS_ACCESS_KEY_ID) {
    throw new Error('AWS_ACCESS_KEY_ID is not set');
  }

  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS_SECRET_ACCESS_KEY is not set');
  }

  if (!process.env.AWS_REGION) {
    throw new Error('AWS_REGION is not set');
  }

  // Проверяем авторизацию
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Получаем метаданные файла
  const { filename, contentType } = await request.json();
  const key = `${user.id}/${formatFileName(filename)}`;

  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    if (!process.env.AWS_BUCKET_NAME) {
      throw new Error('AWS_BUCKET_NAME is not set');
    }

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Conditions: [
        ['content-length-range', 0, MAX_FILE_SIZE],
        ['starts-with', '$Content-Type', 'audio/'],
      ],
      Fields: {
        'Content-Type': contentType,
      },
      Expires: UPLOAD_TIMEOUT_SEC,
    });

    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return NextResponse.json({ url, fields, key, publicUrl });
  } catch (error) {
    console.error('[Presign] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
