// file: app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  createClient as createDeepgramClient,
  CallbackUrl,
} from '@deepgram/sdk';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(request: NextRequest) {
  if (
    !process.env.DEEPGRAM_API_KEY ||
    !process.env.AWS_BUCKET_NAME ||
    !process.env.AWS_REGION ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY
  ) {
    console.log('Missing 3rd party credentials');
    return NextResponse.json(
      { error: '3rd parties credentials are not set' },
      { status: 500 }
    );
  }

  const supabase = createClient();
  const deepgram = createDeepgramClient(process.env.DEEPGRAM_API_KEY);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    console.log('Unauthorized access attempt', userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('User authenticated:', user.id);

  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const metadata = JSON.parse(formData.get('metadata') as string);
        const { id, name, path, size, mimeType } = metadata;

        console.log('Received file upload request:', {
          id,
          name,
          path,
          size,
          mimeType,
        });

        // Форматируем имя файла, заменяя пробелы на дефисы
        const formattedFileName = name
          .replace(/[\s\n\r]+/g, '-') // заменяем пробелы и переносы строк на дефис
          .replace(/[^a-zA-Z0-9-_.]/g, '') // оставляем только буквы, цифры, дефисы, точки и подчеркивания
          .toLowerCase(); // приводим к нижнему регистру для единообразия

        // Generate S3 key
        const key = `${user.id}/${formattedFileName}`;

        console.log('Formatted file name:', {
          original: name,
          formatted: formattedFileName,
          key: key,
        });

        // Преобразуем файл в Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Перед загрузкой в S3
        controller.enqueue(
          encoder.encode(
            'event: progress\ndata: ' +
              JSON.stringify({
                progress: 20,
                message: 'Загрузка файла в хранилище...',
              }) +
              '\n\n'
          )
        );

        // Загружаем файл в S3
        const command = new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        });

        await s3Client.send(command);

        // После загрузки в S3
        controller.enqueue(
          encoder.encode(
            'event: progress\ndata: ' +
              JSON.stringify({
                progress: 40,
                message: 'Файл успешно загружен',
              }) +
              '\n\n'
          )
        );

        // После успешной загрузки формируем публичный URL
        const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        console.log('File uploaded successfully:', publicUrl);

        // Create File record in database
        const { data: newFile, error: insertError } = await supabase
          .from('File')
          .insert({
            id,
            name,
            path: key, // Using S3 key as path
            size,
            mimeType,
            userId: user.id,
            publicUrl,
          })
          .select()
          .single();

        if (insertError) {
          console.log('Error inserting file record:', insertError);
          return NextResponse.json(
            { error: insertError.message },
            { status: 500 }
          );
        }

        console.log('File record created:', newFile.id);

        // После создания записи в БД
        controller.enqueue(
          encoder.encode(
            'event: progress\ndata: ' +
              JSON.stringify({
                progress: 50,
                message: 'Запись создана в базе данных',
              }) +
              '\n\n'
          )
        );

        // Prepare the callback URL
        const origin = request.headers.get('origin') || request.nextUrl.origin;
        console.log('Origin:', origin);
        const callbackUrl = `https://5891-2001-8a0-7207-eb00-bdec-197a-2d1a-328b.ngrok-free.app/api/transcription-callback`;

        console.log('Callback URL prepared:', callbackUrl);

        controller.enqueue(
          encoder.encode(
            'event: progress\ndata: ' +
              JSON.stringify({
                progress: 60,
                message: 'Подготовка к расшифровке',
              }) +
              '\n\n'
          )
        );

        // При отправке в Deepgram
        console.log('Sending to Deepgram:', {
          url: publicUrl,
          callbackUrl,
        });

        const { result, error: deepgramError } =
          await deepgram.listen.prerecorded.transcribeUrlCallback(
            {
              url: publicUrl,
            },
            new CallbackUrl(callbackUrl),
            {
              punctuate: true,
              model: 'nova-2',
              language: 'en-US',
              utterances: true,
            }
          );

        if (deepgramError) {
          console.log('Error in transcription request:', deepgramError);
          return NextResponse.json(
            { error: 'Transcription request failed' },
            { status: 500 }
          );
        }

        console.log('Transcription process started:', result.request_id);

        controller.enqueue(
          encoder.encode(
            'event: progress\ndata: ' +
              JSON.stringify({
                progress: 80,
                message: 'Процесс расшифровки запущен',
              }) +
              '\n\n'
          )
        );

        // Create Transcription record after receiving request_id
        const { data: transcriptionData, error: transcriptionError } =
          await supabase
            .from('Transcription')
            .insert({
              id: result.request_id,
              isTranscribing: true,
              fileId: newFile.id,
              userId: user.id,
            })
            .select()
            .single();

        if (transcriptionError) {
          console.log(
            'Error creating transcription record:',
            transcriptionError
          );
          return NextResponse.json(
            { error: transcriptionError.message },
            { status: 500 }
          );
        }

        console.log('Transcription record created:', transcriptionData.id);

        // Update the File record with the new transcriptionId
        const { error: updateFileError } = await supabase
          .from('File')
          .update({ transcriptionId: transcriptionData.id })
          .eq('id', newFile.id);

        if (updateFileError) {
          console.log('Error updating File record:', updateFileError);
          return NextResponse.json(
            { error: 'Error updating File record' },
            { status: 500 }
          );
        }

        console.log(
          'File record updated with transcriptionId:',
          transcriptionData.id
        );

        controller.enqueue(
          encoder.encode(
            'event: progress\ndata: ' +
              JSON.stringify({
                progress: 100,
                message: 'Готово!',
              }) +
              '\n\n'
          )
        );
        controller.close();
      } catch (error) {
        console.log('Unexpected error:', error);
        controller.enqueue(
          encoder.encode(
            'event: error\ndata: ' + JSON.stringify({ error }) + '\n\n'
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
