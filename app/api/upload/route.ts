// file: app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  createClient as createDeepgramClient,
  CallbackUrl,
} from '@deepgram/sdk';

export async function POST(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.DEEPGRAM_API_KEY
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { id, name, path, size, mimeType, publicUrl } =
          await request.json();
        console.log('Received file upload request:', {
          id,
          name,
          path,
          size,
          mimeType,
        });

        // Create File record in database
        const { data: newFile, error: insertError } = await supabase
          .from('File')
          .insert({
            id,
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
          console.log('Error inserting file record:', insertError);
          return NextResponse.json(
            { error: insertError.message },
            { status: 500 }
          );
        }

        console.log('File record created:', newFile.id);

        controller.enqueue(
          encoder.encode(
            'event: progress\ndata: ' +
              JSON.stringify({ progress: 50, message: 'File record created' }) +
              '\n\n'
          )
        );

        // Prepare the callback URL
        const origin = request.headers.get('origin') || request.nextUrl.origin;
        console.log('Origin:', origin);
        const callbackUrl = `${origin}/api/transcription-callback`;

        console.log('Callback URL prepared:', callbackUrl);

        controller.enqueue(
          encoder.encode(
            'event: progress\ndata: ' +
              JSON.stringify({
                progress: 60,
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
              JSON.stringify({ progress: 100, message: 'Process completed' }) +
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
