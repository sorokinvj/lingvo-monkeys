import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const fileId = params.id;
  if (
    !process.env.AWS_REGION ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY
  ) {
    return NextResponse.json(
      { error: 'AWS credentials are not set' },
      { status: 500 }
    );
  }
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

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

  // Delete the file from S3
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: file.path,
    });
    await s3Client.send(deleteCommand);
    console.log('File deleted from S3');
  } catch (error) {
    console.log('Error deleting file from S3:', error);
    return NextResponse.json(
      { error: 'Failed to delete file from storage' },
      { status: 500 }
    );
  }

  // Delete the file record
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
