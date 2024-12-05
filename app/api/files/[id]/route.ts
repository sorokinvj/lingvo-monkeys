import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const fileId = params.id;

  if (!fileId) {
    return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
  }

  // Fetch the file details
  const { data: file, error: fetchError } = await supabase
    .from('File')
    .select('path, transcriptionId')
    .eq('id', fileId)
    .single();

  if (fetchError || !file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Delete the file from storage
  const { error: storageError } = await supabase.storage
    .from('audio-files')
    .remove([file.path]);

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  // Delete the transcription record
  if (file.transcriptionId) {
    const { error: transcriptionError } = await supabase
      .from('Transcription')
      .delete()
      .eq('id', file.transcriptionId);

    if (transcriptionError) {
      return NextResponse.json(
        { error: transcriptionError.message },
        { status: 500 }
      );
    }
  }

  // Delete the file record
  const { error: fileError } = await supabase
    .from('File')
    .delete()
    .eq('id', fileId);

  if (fileError) {
    return NextResponse.json({ error: fileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
