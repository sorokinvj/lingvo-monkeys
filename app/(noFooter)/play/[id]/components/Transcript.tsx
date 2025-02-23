import { FC, useState, useEffect, useCallback, Fragment } from 'react';
import { FullTranscription } from '@/schema/models';
import { useSettings } from '@/hooks/useSettings';
import { AVAILABLE_FONTS } from '@/config/fonts';

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
  const { settings } = useSettings();
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [clickCount, setClickCount] = useState(0);

  const findActiveWordIndex = useCallback(
    (words: any[], timeMS: number) => {
      const adjustedTime = timeMS - settings.highlightDelay * 1000;
      return words.findIndex((word, index) => {
        const nextWord = words[index + 1];
        if (nextWord) {
          return (
            adjustedTime >= word.start * 1000 &&
            adjustedTime < nextWord.start * 1000
          );
        }
        return (
          adjustedTime >= word.start * 1000 && adjustedTime <= word.end * 1000
        );
      });
    },
    [settings.highlightDelay]
  );

  const isInSameRow = useCallback((word1: DOMRect, word2: DOMRect) => {
    const threshold = 5;
    return Math.abs(word1.top - word2.top) < threshold;
  }, []);

  const shouldHighlight = useCallback(
    (index: number, spanRef: HTMLSpanElement | null) => {
      if (!spanRef) return false;

      switch (settings.highlightMode) {
        case 'current':
          return index === activeWordIndex;
        case 'all past':
          return index <= activeWordIndex;
        case 'past row': {
          if (activeWordIndex === -1) return false;

          const activeWordElement = document.querySelector(
            `[data-word-index="${activeWordIndex}"]`
          );
          if (!activeWordElement) return false;

          const activeWordRect = activeWordElement.getBoundingClientRect();
          const currentWordRect = spanRef.getBoundingClientRect();

          return isInSameRow(activeWordRect, currentWordRect);
        }
        default:
          return false;
      }
    },
    [activeWordIndex, settings.highlightMode, isInSameRow]
  );

  const applyWordStyles = useCallback(
    (el: HTMLSpanElement | null, index: number) => {
      if (!el) return;

      const highlight = shouldHighlight(index, el);
      const selectedFont = AVAILABLE_FONTS.find(
        (font) => font.name === settings.fontFamily
      );

      Object.assign(el.style, {
        color: highlight ? settings.pastWordsColor : settings.currentWordColor,
        backgroundColor: highlight
          ? settings.pastWordsHighlightColor
          : settings.currentWordHighlightColor,
        fontSize: `${settings.fontSize}rem`,
        lineHeight: settings.lineHeight,
        fontFamily: selectedFont?.value || 'system-ui',
        fontSmooth: 'always',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1, "dlig" 1',
        textRendering: 'optimizeLegibility',
        letterSpacing: '-0.01em',
      });
    },
    [settings, shouldHighlight]
  );

  const handleWordClick = useCallback(
    (event: React.MouseEvent, time: number) => {
      event.preventDefault();
      event.stopPropagation();
      setClickCount((prev) => prev + 1);
      onWordClick(time + clickCount * 0.0001);
    },
    [onWordClick, clickCount]
  );

  useEffect(() => {
    if (transcript) {
      const words = transcript.results.channels[0].alternatives[0].words;
      const newActiveIndex = findActiveWordIndex(words, currentTimeMS);
      if (newActiveIndex !== -1) {
        setActiveWordIndex(newActiveIndex);
      }
    }
  }, [currentTimeMS, transcript]);

  const renderWords = useCallback(
    (words: any[]) => {
      let currentSentence: any[] = [];
      const sentences: any[][] = [];

      words.forEach((word, index) => {
        currentSentence.push(word);

        const isPeriod = word.punctuated_word.match(/[.!?]$/);
        const nextWord = words[index + 1];

        // Считаем значимую паузу только если она больше минимального порога
        const timeGap = nextWord ? nextWord.start - word.end : 0;
        const MINIMUM_SIGNIFICANT_GAP = 0.5; // полсекунды минимальная значимая пауза
        const isSignificantGap =
          timeGap > MINIMUM_SIGNIFICANT_GAP &&
          timeGap > settings.pauseThreshold;

        if (isPeriod || isSignificantGap) {
          sentences.push([...currentSentence]);
          currentSentence = [];
        }
      });

      if (currentSentence.length > 0) {
        sentences.push(currentSentence);
      }

      // Сохраняем информацию о паузах между предложениями
      const sentenceBreaks: boolean[] = sentences.map((_, index) => {
        if (index === sentences.length - 1) return false;

        const lastWordInSentence =
          sentences[index][sentences[index].length - 1];
        const firstWordInNextSentence = sentences[index + 1][0];

        const timeGap = firstWordInNextSentence.start - lastWordInSentence.end;
        return timeGap > settings.pauseThreshold;
      });

      return sentences.map((sentence, sentenceIndex) => (
        <Fragment key={`sentence-${sentenceIndex}`}>
          <span
            className="inline-block"
            style={{
              hyphens: 'auto',
              WebkitHyphens: 'auto',
              msHyphens: 'auto',
            }}
          >
            {sentence.map((word: any, index: number) => (
              <Fragment key={`${word.start}-${word.end}`}>
                <span
                  data-start={word.start}
                  data-end={word.end}
                  data-word-index={words.indexOf(word)}
                  ref={(el) => applyWordStyles(el, words.indexOf(word))}
                  className="inline cursor-pointer px-0.5 py-0.5 rounded selection:bg-blue-200 dark:selection:bg-blue-800"
                  onClick={(e) => handleWordClick(e, word.start)}
                  onMouseDown={(e) => e.preventDefault()}
                  suppressHydrationWarning={true}
                >
                  {word.punctuated_word}
                </span>
                {index < sentence.length - 1 && ' '}
              </Fragment>
            ))}
          </span>
          {settings.enableTextBreathing &&
            sentenceIndex < sentences.length - 1 &&
            sentenceBreaks[sentenceIndex] && (
              <>
                {[...Array(settings.pauseLines)].map((_, i) => (
                  <br key={i} />
                ))}
              </>
            )}
        </Fragment>
      ));
    },
    [settings, applyWordStyles, handleWordClick]
  );

  if (!transcript) return null;

  const words = transcript.results.channels[0].alternatives[0].words;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div
        className="font-serif text-lg leading-relaxed break-words dark:text-gray-200 subpixel-antialiased"
        style={{
          textAlign: settings.textAlignment,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        {renderWords(words)}
      </div>
    </div>
  );
};

export default Transcription;
