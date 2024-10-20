'use client';

import React, { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Transcript from './Transcript';
import Player from './Player';
import { createClient } from '@/utils/supabase/client';
import { WaveSurferProvider } from '@/hooks/useWavesurfer';

const fetchTranscription = async (transcriptionId: string) => {
  const supabase = createClient();
  const { data: transcript, error } = await supabase
    .from('Transcription')
    .select('*')
    .eq('id', transcriptionId)
    .single();
  if (error) {
    throw error;
  }
  return transcript;
};

type Props = {
  publicUrl: string;
  transcriptionId: string;
};

const PlayTranscript: React.FC<Props> = ({ publicUrl, transcriptionId }) => {
  const { data: transcript } = useQuery({
    queryKey: ['transcription', transcriptionId],
    queryFn: () => fetchTranscription(transcriptionId),
  });
  const [jumpToPositionMS, setJumpToPositionMS] = useState<number | undefined>(
    undefined
  );
  const [currentTimeMS, setCurrentTimeMS] = useState(0);

  const handleWordClick = (time: number) => {
    setJumpToPositionMS(time * 1000);
  };

  const handleTimeUpdate = useCallback((timeMS: number) => {
    setCurrentTimeMS(timeMS);
  }, []);

  return (
    <WaveSurferProvider>
      <div className="max-w-3xl mx-auto bg-gray-50 rounded-lg shadow-md relative flex flex-col h-[calc(100vh-2rem)] pb-32">
        <div className="flex-grow overflow-y-auto p-6">
          <Transcript
            transcript={transcript?.fullTranscription}
            currentTimeMS={currentTimeMS}
            onWordClick={handleWordClick}
          />
        </div>
        <Player
          publicUrl={publicUrl}
          jumpToPositionMS={jumpToPositionMS}
          onTimeUpdate={handleTimeUpdate}
        />
      </div>
    </WaveSurferProvider>
  );
};

export default PlayTranscript;
