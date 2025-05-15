import React, { useMemo, memo, forwardRef } from 'react';
import { AVAILABLE_FONTS } from '@/config/fonts';
import { useSettings } from '@/hooks/useSettings';

interface TranscriptWordProps {
  word: {
    punctuated_word: string;
    start: number;
    end: number;
  };
  index: number;
  activeWordIndex: number;
  shouldHighlight: (index: number) => boolean;
  onWordClick: (time: number, wordIndex: number) => void;
}

const TranscriptWord = memo(
  forwardRef<HTMLSpanElement, TranscriptWordProps>(
    ({ word, index, activeWordIndex, shouldHighlight, onWordClick }, ref) => {
      const { settings } = useSettings();

      const isHighlighted = useMemo(() => {
        return shouldHighlight(index);
      }, [index, activeWordIndex, shouldHighlight]);

      const styles = useMemo(() => {
        const selectedFont = AVAILABLE_FONTS.find(
          (font) => font.name === settings.fontFamily
        );

        return {
          color: isHighlighted
            ? settings.pastWordsColor
            : settings.currentWordColor,
          backgroundColor: isHighlighted
            ? settings.pastWordsHighlightColor
            : settings.currentWordHighlightColor,
          fontSize: `${settings.fontSize}rem`,
          lineHeight: settings.lineHeight,
          fontFamily: selectedFont?.value || 'system-ui',
          fontSmooth: 'always',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1, "dlig" 1',
          textRendering: 'optimizeLegibility' as 'optimizeLegibility',
          letterSpacing: '-0.01em',
        };
      }, [isHighlighted, settings]);

      const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onWordClick(word.start, index);
      };

      return (
        <span
          ref={ref}
          data-start={word.start}
          data-end={word.end}
          data-word-index={index}
          className="inline cursor-pointer px-0.5 py-0.5 rounded selection:bg-blue-200 dark:selection:bg-blue-800"
          style={styles}
          onClick={handleClick}
          onMouseDown={(e) => e.preventDefault()}
          suppressHydrationWarning={true}
        >
          {word.punctuated_word}
        </span>
      );
    }
  )
);

TranscriptWord.displayName = 'TranscriptWord';

export default TranscriptWord;
