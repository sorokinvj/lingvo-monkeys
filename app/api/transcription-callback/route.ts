import { NextRequest, NextResponse } from 'next/server';
import { Tables, Columns } from '@/schema/schema';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: 'Supabase credentials are not set' },
        { status: 500 }
      );
    }

    const supabase = createClient();
    const adminClient = createClient({ useServiceRole: true });

    const body = await request.json();
    console.log('Received callback body:', body);

    const transcriptionId = body.metadata.request_id;

    // Extract the transcript from the full transcription object
    const transcript = body.results.channels[0].alternatives[0].transcript;

    // Update the Transcription record with the results
    const { data: transcriptionData, error } = await supabase
      .from(Tables.TRANSCRIPTION)
      .update({
        content: transcript,
        isTranscribing: false,
        fullTranscription: body,
      })
      .eq('id', transcriptionId)
      .select(); // Add this to return the updated row

    if (error || !transcriptionData) {
      console.error('Error updating transcription:', error);
      return NextResponse.json(
        { error: 'Failed to update transcription' },
        { status: 500 }
      );
    }

    // Now we can safely use transcriptionData
    const updatedTranscription = transcriptionData[0]; // It's an array, so we take the first item

    // Update the File record with the new transcriptionId and status
    const { data: fileData, error: updateFileError } = await supabase
      .from(Tables.FILE)
      .update({
        status: 'transcribed',
      })
      .eq('id', updatedTranscription.fileId)
      .select('id')
      .single();

    if (updateFileError) {
      console.error('Error updating File record:', updateFileError);
      return NextResponse.json(
        { error: 'Error updating File record' },
        { status: 500 }
      );
    }

    // Найдем последнее событие загрузки для этого файла
    const { data: uploadEvent, error: findEventError } = await adminClient
      .from(Tables.FILE_UPLOAD_EVENT)
      .select('id')
      .eq(Columns.COMMON.FILE_ID, fileData.id)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    if (!findEventError && uploadEvent) {
      // Обновим статус события загрузки на "transcribed"
      await adminClient
        .from(Tables.FILE_UPLOAD_EVENT)
        .update({
          status: 'transcribed',
        })
        .eq('id', uploadEvent.id)
        .eq(Columns.COMMON.FILE_ID, fileData.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing transcription callback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
