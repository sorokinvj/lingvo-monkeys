'use client';

import React, { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings2 } from 'lucide-react';
import Transcript from './Transcript';
import Player from './Player';
import { createClient } from '@/utils/supabase/client';
import { Drawer } from '@/components/ui/drawer';
import Settings from './Settings';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    <div className="mt-4 mx-auto bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md relative flex flex-col h-[calc(100vh-6rem)] pb-32">
      <div className="absolute z-40 -translate-x-1/2 top-6">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-4 bg-white dark:bg-gray-800 hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors border border-gray-400 dark:border-gray-600 rounded-full"
          aria-label="Open settings"
        >
          <Settings2 className="h-5 w-5 dark:text-gray-200" />
        </button>

        <Drawer
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          position="left"
          width="w-80"
          minWidth="min-w-[380px]"
        >
          <Settings />
        </Drawer>
      </div>
      <div className="flex-grow overflow-y-auto p-6">
        <Transcript
          transcript={transcript?.fullTranscription}
          currentTimeMS={currentTimeMS}
          onWordClick={handleWordClick}
        />
      </div>
      <div className="fixed bottom-6 left-8 right-8 mx-auto w-11/12 max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-50">
        <Player
          publicUrl={publicUrl}
          jumpToPositionMS={jumpToPositionMS}
          onTimeUpdate={handleTimeUpdate}
        />
      </div>
    </div>
  );
};

export default PlayTranscript;
