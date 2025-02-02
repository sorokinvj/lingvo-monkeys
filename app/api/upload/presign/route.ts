import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { formatFileName } from '@/utils/utils';

export async function POST(request: NextRequest) {
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
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
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
        ['content-length-range', 0, 1024 * 1024 * 1024], // до 1GB
        ['starts-with', '$Content-Type', 'audio/'],
      ],
      Fields: {
        'Content-Type': contentType,
      },
      Expires: 600, // 10 минут
    });

    return NextResponse.json({ url, fields, key });
  } catch (error) {
    console.error('[Presign] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
