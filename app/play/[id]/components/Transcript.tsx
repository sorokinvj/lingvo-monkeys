import { FC, useState, useEffect, useCallback } from 'react';
import { FullTranscription } from '@/schema/models';
import { useSettings } from '@/app/hooks/useSettings';

type Props = {
  transcript?: FullTranscription | null;
  currentTimeMS: number;
  onWordClick: (time: number) => void;
};

const Transcription: FC<Props> = ({
  transcript,
  currentTimeMS,
  onWordClick,
}) => {
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const { settings } = useSettings();

  const findActiveWordIndex = useCallback((words: any[], timeMS: number) => {
    return words.findIndex((word, index) => {
      const nextWord = words[index + 1];
      if (nextWord) {
        return timeMS >= word.start * 1000 && timeMS < nextWord.start * 1000;
      }
      return timeMS >= word.start * 1000 && timeMS <= word.end * 1000;
    });
  }, []);

  useEffect(() => {
    if (transcript) {
      const words = transcript.results.channels[0].alternatives[0].words;
      const newActiveIndex = findActiveWordIndex(words, currentTimeMS);
      if (newActiveIndex !== -1) {
        setActiveWordIndex(newActiveIndex);
      }
    }
  }, [currentTimeMS, transcript, findActiveWordIndex]);

  if (!transcript) return null;

  const words = transcript.results.channels[0].alternatives[0].words;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 overflow-hidden">
      <div className="font-serif text-lg leading-relaxed break-words">
        {words.map((word, index) => (
          <span
            key={`${word.start}-${word.end}`}
            data-start={word.start}
            data-end={word.end}
            className="inline-block cursor-pointer px-1 py-0.5 m-0.5 rounded"
            style={
              index < activeWordIndex
                ? {
                    color: settings.pastWordsColor,
                    transition: 'color 0.3s, opacity 0.3s',
                    fontSize: `${settings.fontSize}px`,
                    backgroundColor: settings.pastWordsHighlightColor,
                  }
                : {
                    fontSize: `${settings.fontSize}px`,
                    color: settings.currentWordColor,
                    transition: 'color 0.3s, opacity 0.3s',
                    backgroundColor: settings.currentWordHighlightColor,
                  }
            }
            onClick={() => onWordClick(word.start)}
          >
            {word.punctuated_word}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Transcription;
