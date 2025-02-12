// file: app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  createClient as createDeepgramClient,
  CallbackUrl,
} from '@deepgram/sdk';
import { UPLOAD_STAGES } from '@/config/constants';

export async function POST(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.DEEPGRAM_API_KEY
  ) {
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { name, path, size, mimeType, publicUrl } = await request.json();

        // Добавляем четкие логи на каждом этапе
        console.log('[API] Starting file processing:', { name, path });

        // Отправляем начальное событие клиенту
        controller.enqueue(
          encoder.encode(
            'event: progress\ndata: ' +
              JSON.stringify({
                progress: 0,
                message: 'Starting processing...',
              }) +
              '\n\n'
          )
        );

        // Create File record in database
        const { data: newFile, error: insertError } = await supabase
          .from('File')
          .insert({
            name,
            path,
            size,
            mimeType,
            userId: user.id,
            publicUrl,
          })
          .select()
          .single();

        if (insertError) {
          return NextResponse.json(
            { error: insertError.message },
            { status: 500 }
          );
        }

        controller.enqueue(
          encoder.encode(
            'event: progress\ndata: ' +
              JSON.stringify({
                progress: UPLOAD_STAGES.PRESIGN,
                message: 'File record created',
              }) +
              '\n\n'
          )
        );

        // Prepare the callback URL
        const origin = request.headers.get('origin') || request.nextUrl.origin;
        const callbackUrl = `${origin}/api/transcription-callback`;

        controller.enqueue(
          encoder.encode(
            'event: progress\ndata: ' +
              JSON.stringify({
                progress: UPLOAD_STAGES.PREPARING,
                message: 'Preparing transcription',
              }) +
              '\n\n'
          )
        );

        const { result, error: deepgramError } =
          await deepgram.listen.prerecorded.transcribeUrlCallback(
            {
              url: publicUrl,
            },
            new CallbackUrl(callbackUrl),
            {
              punctuate: true,
              model: 'nova-3',
              language: 'en-US',
              utterances: true,
            }
          );

        if (deepgramError) {
          return NextResponse.json(
            { error: 'Transcription request failed' },
            { status: 500 }
          );
        }
        controller.enqueue(
          encoder.encode(
            'event: progress\ndata: ' +
              JSON.stringify({
                progress: UPLOAD_STAGES.PROCESSING,
                message: 'Transcription process started',
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
          return NextResponse.json(
            { error: transcriptionError.message },
            { status: 500 }
          );
        }

        // Update the File record with the new transcriptionId
        const { error: updateFileError } = await supabase
          .from('File')
          .update({ transcriptionId: transcriptionData.id })
          .eq('id', newFile.id);

        if (updateFileError) {
          return NextResponse.json(
            { error: 'Error updating File record' },
            { status: 500 }
          );
        }

        controller.enqueue(
          encoder.encode(
            'event: progress\ndata: ' +
              JSON.stringify({
                progress: UPLOAD_STAGES.COMPLETED,
                message: 'Process completed',
              }) +
              '\n\n'
          )
        );

        // Отправляем событие завершения
        controller.enqueue(
          encoder.encode(
            'event: complete\ndata: ' +
              JSON.stringify({ success: true }) +
              '\n\n'
          )
        );

        console.log('[API] Processing completed');
        controller.close();
      } catch (error) {
        console.error('[API] Error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(
          encoder.encode(
            'event: error\ndata: ' +
              JSON.stringify({ error: errorMessage }) +
              '\n\n'
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
