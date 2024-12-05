import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const fileId = params.id;

  console.log('Received DELETE request for file ID:', fileId);

  if (!fileId) {
    console.log('File ID is missing');
    return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
  }

  // Fetch the file details
  const { data: file, error: fetchError } = await supabase
    .from('File')
    .select('path, transcriptionId')
    .eq('id', fileId)
    .single();

  if (fetchError || !file) {
    console.log('Error fetching file:', fetchError);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  console.log('File details fetched:', file);

  // Delete the file from storage
  const { error: storageError } = await supabase.storage
    .from('audio-files')
    .remove([file.path]);

  if (storageError) {
    console.log('Error deleting file from storage:', storageError);
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  console.log('File deleted from storage');

  // Delete the file record first
  const { error: fileError } = await supabase
    .from('File')
    .delete()
    .eq('id', fileId);

  if (fileError) {
    console.log('Error deleting file record:', fileError);
    return NextResponse.json({ error: fileError.message }, { status: 500 });
  }

  console.log('File record deleted successfully');

  // Delete the transcription record
  if (file.transcriptionId) {
    const { error: transcriptionError } = await supabase
      .from('Transcription')
      .delete()
      .eq('id', file.transcriptionId);

    if (transcriptionError) {
      console.log('Error deleting transcription record:', transcriptionError);
      return NextResponse.json(
        { error: transcriptionError.message },
        { status: 500 }
      );
    }

    console.log('Transcription record deleted');
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
