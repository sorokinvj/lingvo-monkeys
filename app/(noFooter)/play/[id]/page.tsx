import { createClient } from '@/utils/supabase/server';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import PlayTranscript from './components/PlayTranscript';

export default async function PlayPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  // Fetch the file record
  const { data: file, error: fileError } = await supabase
    .from('File')
    .select('*')
    .eq('id', params.id)
    .single();

  if (fileError) {
    throw new Error(`Error fetching file: ${fileError.message}`);
  }

  if (!file) {
    throw new Error('File not found');
  }

  const queryClient = new QueryClient();

  const fetchTranscriptionSSR = async () => {
    const { data: transcript, error: transcriptError } = await supabase
      .from('Transcript')
      .select('*')
      .eq('id', file.transcriptionId)
      .single();

    if (transcriptError) {
      throw new Error(`Error fetching transcript: ${transcriptError.message}`);
    }
    return transcript;
  };

  queryClient.prefetchQuery({
    queryKey: ['transcription', file.transcriptionId],
    queryFn: fetchTranscriptionSSR,
  });

  // Prefetch and hydrate the transcript data for client-side use
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlayTranscript
        publicUrl={file.publicUrl}
        transcriptionId={file.transcriptionId}
      />
    </HydrationBoundary>
  );
}
