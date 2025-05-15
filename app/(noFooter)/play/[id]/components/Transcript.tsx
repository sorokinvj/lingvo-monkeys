import { FC, useState, useEffect, useCallback, Fragment, useRef } from 'react';
import { FullTranscription } from '@/schema/models';
import { useSettings } from '@/hooks/useSettings';
import TranscriptWord from './TranscriptWord';
import BreakLine from './BreakLine';

type Props = {
  transcript?: FullTranscription | null;
  currentTimeMS: number;
  onWordClick: (time: number, wordIndex?: number) => void;
  shouldScrollToWord?: boolean;
};

const Transcription: FC<Props> = ({
  transcript,
  currentTimeMS,
  onWordClick,
  shouldScrollToWord = false,
}) => {
  const { settings } = useSettings();
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [clickCount, setClickCount] = useState(0);

  // Для отслеживания DOM-элементов слов (для прокрутки)
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  // Реф на контейнер для прокрутки
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Регистрация рефа для слова
  const registerWordRef = useCallback(
    (index: number, element: HTMLSpanElement | null) => {
      if (element) {
        wordRefs.current.set(index, element);
      } else {
        wordRefs.current.delete(index);
      }
    },
    []
  );

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

  // Пороговое значение для определения, что слова находятся на одной строке (в пикселях)
  const ROW_THRESHOLD = 5;

  const isInSameRow = useCallback((word1: DOMRect, word2: DOMRect) => {
    return Math.abs(word1.top - word2.top) < ROW_THRESHOLD;
  }, []);

  // Определение, должно ли слово быть подсвечено
  const shouldHighlight = useCallback(
    (index: number) => {
      if (activeWordIndex === -1) return false;

      switch (settings.highlightMode) {
        case 'current':
          return index === activeWordIndex;
        case 'all past':
          return index <= activeWordIndex;
        case 'past row': {
          const activeWordElement = wordRefs.current.get(activeWordIndex);
          const currentWordElement = wordRefs.current.get(index);

          if (!activeWordElement || !currentWordElement) return false;

          const activeRect = activeWordElement.getBoundingClientRect();
          const currentRect = currentWordElement.getBoundingClientRect();

          // Подсвечиваем только слова на той же строке
          return Math.abs(activeRect.top - currentRect.top) < ROW_THRESHOLD;
        }
        default:
          return false;
      }
    },
    [activeWordIndex, settings.highlightMode]
  );

  const handleWordClick = useCallback(
    (time: number, wordIndex: number) => {
      setClickCount((prev) => prev + 1);
      onWordClick(time + clickCount * 0.0001, wordIndex);
    },
    [onWordClick, clickCount]
  );

  // Функция для прокрутки к активному слову
  const scrollToActiveWord = useCallback((wordIndex: number) => {
    // Получаем элемент по индексу из нашей мапы рефов
    const wordElement = wordRefs.current.get(wordIndex);
    // Находим ближайший scrollable контейнер
    const scrollContainer =
      scrollContainerRef.current?.closest('.overflow-y-auto');

    if (!wordElement || !scrollContainer) return;

    // Получаем позиции элементов
    const containerRect = scrollContainer.getBoundingClientRect();
    const elementRect = wordElement.getBoundingClientRect();

    // Проверяем видимость
    const isVisible =
      elementRect.top >= containerRect.top &&
      elementRect.bottom <= containerRect.bottom;

    if (!isVisible) {
      // Вычисляем позицию для прокрутки
      const scrollTop =
        scrollContainer.scrollTop +
        (elementRect.top - containerRect.top) -
        containerRect.height / 2 +
        elementRect.height / 2;

      // Плавно прокручиваем
      scrollContainer.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    if (!transcript) return;

    const words = transcript.results.channels[0].alternatives[0].words;
    const newActiveIndex = findActiveWordIndex(words, currentTimeMS);

    // КРИТИЧЕСКИ ВАЖНО!
    // Эта проверка на неравенство с текущим activeWordIndex предотвращает
    // бесконечный цикл обновлений состояния. Если её удалить или изменить,
    // React будет уходить в Maximum update depth exceeded.
    // Строчка setActiveWordIndex вызывает перерендер, который в свою очередь
    // вызовет новое обновление времени, новый вызов useEffect, и т.д.
    // Эта проверка разрывает потенциальный цикл обновлений!
    if (newActiveIndex !== -1 && newActiveIndex !== activeWordIndex) {
      setActiveWordIndex(newActiveIndex);

      // Прокручиваем к слову, если нужно, используя нашу функцию
      if (shouldScrollToWord) {
        scrollToActiveWord(newActiveIndex);
      }
    }
  }, [
    transcript,
    currentTimeMS,
    findActiveWordIndex,
    shouldScrollToWord,
    activeWordIndex,
    scrollToActiveWord,
  ]);

  if (!transcript) return null;

  const words = transcript.results.channels[0].alternatives[0].words;

  return (
    <div
      className="max-w-4xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 overflow-hidden"
      ref={scrollContainerRef}
    >
      <div
        className="font-serif text-lg dark:text-gray-200 subpixel-antialiased"
        style={{ textAlign: settings.textAlignment }}
      >
        {words.map((word: any, index: number) => (
          <Fragment key={`${word.start}-${word.end}`}>
            <TranscriptWord
              word={word}
              index={index}
              activeWordIndex={activeWordIndex}
              shouldHighlight={shouldHighlight}
              onWordClick={handleWordClick}
              ref={(el) => registerWordRef(index, el)}
            />{' '}
            {settings.enableTextBreathing &&
              index < words.length - 1 &&
              words[index + 1].start - word.end > settings.pauseThreshold && (
                <BreakLine count={settings.pauseLines} />
              )}
          </Fragment>
        ))}
      </div>
    </div>
  );
};

export default Transcription;
