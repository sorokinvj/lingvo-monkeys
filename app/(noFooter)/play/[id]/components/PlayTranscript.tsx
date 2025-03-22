'use client';

import React, { useCallback, useState } from 'react';
import { Tables, Columns } from '@/schema/schema';
import { useQuery } from '@tanstack/react-query';
import { Settings2 } from 'lucide-react';
import Transcript from './Transcript';
import Player from './Player';
import { createClient } from '@/utils/supabase/client';
import { Drawer } from '@/components/ui/drawer';
import Settings from './Settings';
import { useParams } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';

const fetchTranscription = async (transcriptionId: string) => {
  const supabase = createClient();
  const { data: transcript, error } = await supabase
    .from(Tables.TRANSCRIPTION)
    .select('*')
    .eq('id', transcriptionId)
    .single();
  if (error) {
    throw error;
  }
  return transcript;
};

const fetchFileInfo = async (transcriptionId: string) => {
  const supabase = createClient();
  const { data: file, error } = await supabase
    .from(Tables.FILE)
    .select('name')
    .eq('transcriptionId', transcriptionId)
    .single();
  if (error) {
    throw error;
  }
  return file;
};

type Props = {
  publicUrl: string;
  transcriptionId: string;
};

const PlayTranscript: React.FC<Props> = ({ publicUrl, transcriptionId }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const params = useParams();
  const fileId = typeof params.id === 'string' ? params.id : '';
  const { trackPlayerInteraction } = useAnalytics();

  const { data: transcript } = useQuery({
    queryKey: ['transcription', transcriptionId],
    queryFn: () => fetchTranscription(transcriptionId),
  });

  const { data: fileInfo } = useQuery({
    queryKey: ['file-info', transcriptionId],
    queryFn: () => fetchFileInfo(transcriptionId),
  });

  const [jumpToPositionMS, setJumpToPositionMS] = useState<number | undefined>(
    undefined
  );
  const [currentTimeMS, setCurrentTimeMS] = useState(0);
  const [shouldScrollToWord, setShouldScrollToWord] = useState(false);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);

  const handleDurationReady = useCallback((duration: number) => {
    setTotalDuration(duration);
  }, []);

  const handleWordClick = (time: number, wordIndex?: number) => {
    const timeInSeconds = time;
    const timeInMs = time * 1000;

    // Отправляем событие аналитики
    trackPlayerInteraction({
      fileId,
      fileName: fileInfo?.name || 'Unknown File',
      actionType: 'seek',
      position: timeInSeconds,
      metadata: {
        source: 'transcript',
        wordIndex: wordIndex,
        method: 'word_click',
        positionPercent: totalDuration
          ? Math.round((timeInSeconds / totalDuration) * 100)
          : null,
        totalDuration: totalDuration || null,
      },
    });

    // Устанавливаем позицию для перехода
    setJumpToPositionMS(timeInMs);
  };

  const handleTimeUpdate = useCallback((timeMS: number) => {
    setCurrentTimeMS(timeMS);
    setShouldScrollToWord(false);
  }, []);

  const handleWaveformSeek = useCallback((timeMS: number) => {
    setShouldScrollToWord(true);
  }, []);

  return (
    <div className="mx-auto bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md relative flex flex-col h-[calc(100vh-6rem)] pb-32">
      {fileInfo && (
        <div className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700 w-full text-center">
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate px-10">
            {fileInfo.name}
          </h1>
        </div>
      )}

      <div className="absolute z-40 top-2 right-2 md:top-6 md:right-6">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-4 bg-white/50 dark:bg-gray-800 hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors border border-gray-400 dark:border-gray-600 rounded-full"
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
      <div className="flex-grow overflow-y-auto md:p-6">
        <Transcript
          transcript={transcript?.fullTranscription}
          currentTimeMS={currentTimeMS}
          onWordClick={handleWordClick}
          shouldScrollToWord={shouldScrollToWord}
        />
        <div className="fixed w-full left-0 bottom-0 right-0 md:bottom-6 md:left-8 md:right-8 mx-auto md:w-11/12 max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 md:p-4 z-50">
          <Player
            publicUrl={publicUrl}
            fileId={fileId}
            jumpToPositionMS={jumpToPositionMS}
            onTimeUpdate={handleTimeUpdate}
            onWaveformSeek={handleWaveformSeek}
            onDurationReady={handleDurationReady}
            fileName={fileInfo?.name}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayTranscript;
