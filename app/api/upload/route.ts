// file: app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  createClient as createDeepgramClient,
  CallbackUrl,
} from '@deepgram/sdk';

export async function POST(request: NextRequest) {
  try {
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

    // Add this line to log the Supabase URL
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the bucket exists, if not, create it
    const BUCKET_NAME = 'audio-files';
    // Proceed with file upload
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`${user.id}/${Date.now()}_${file.name}`, file);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get the public URL of the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    // Create File record in database
    const { data: newFile, error: insertError } = await supabase
      .from('File')
      .insert({
        name: file.name,
        path: data.path,
        size: file.size,
        mimeType: file.type,
        userId: user.id,
        publicUrl,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Initialize Deepgram client
    const deepgram = createDeepgramClient(process.env.DEEPGRAM_API_KEY);

    // Prepare the callback URL
    const ngrokUrl =
      'https://ead4-2001-8a0-7207-eb00-1d84-bf5-1ac0-9fca.ngrok-free.app';
    const origin = request.headers.get('origin') || request.nextUrl.origin;
    const callbackUrl = `${ngrokUrl}/api/transcription-callback`;

    // Send asynchronous transcription request
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
    console.log('Deepgram transcription error:', deepgramError);
    if (deepgramError) {
      return NextResponse.json(
        { error: 'Transcription request failed' },
        { status: 500 }
      );
    }

    console.log('Deepgram transcription request:', result);

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
      console.error('Error updating File record:', updateFileError);
      return NextResponse.json(
        { error: 'Error updating File record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: newFile,
      transcriptionId: result.request_id,
      message: 'Transcription process started',
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
