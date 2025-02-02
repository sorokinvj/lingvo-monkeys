import { useState, useCallback, useEffect } from 'react';
import { UPLOAD_STAGES, type UploadStage } from '@/config/constants';

interface UseUploadProgressProps {
  onComplete?: () => void;
}

export const useUploadProgress = ({
  onComplete,
}: UseUploadProgressProps = {}) => {
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState(false);

  const reset = useCallback(() => {
    setProgress(0);
    setMessage('');
    setIsCompleted(false);
  }, []);

  const updateProgress = useCallback(
    (stage: UploadStage, current: number = 100) => {
      // Если загрузка уже завершена, игнорируем обновления
      if (isCompleted) return;

      const stages = Object.keys(UPLOAD_STAGES) as UploadStage[];
      const currentIndex = stages.indexOf(stage);
      const currentStageValue = UPLOAD_STAGES[stage];
      const prevStageValue =
        currentIndex > 0 ? UPLOAD_STAGES[stages[currentIndex - 1]] : 0;

      if (stage === 'COMPLETED') {
        setIsCompleted(true);
      }

      // Для этапа UPLOAD используем прямой процент от XHR
      if (stage === 'UPLOAD') {
        const uploadStartProgress = UPLOAD_STAGES.PREPARING;
        const uploadEndProgress = UPLOAD_STAGES.UPLOAD;
        const uploadRange = uploadEndProgress - uploadStartProgress;
        setProgress(
          Math.round(uploadStartProgress + (current * uploadRange) / 100)
        );
        return;
      }

      // Для остальных этапов используем диапазон между этапами
      const range = currentStageValue - prevStageValue;
      const calculatedProgress = prevStageValue + (range * current) / 100;
      setProgress(Math.round(calculatedProgress));
    },
    [isCompleted]
  );

  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => {
        reset();
        onComplete?.();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isCompleted, onComplete, reset]);

  return {
    progress,
    message,
    setMessage,
    updateProgress,
    reset,
  };
};

// Вспомогательная функция для получения предыдущего этапа
const getPreviousStage = (stage: UploadStage): UploadStage => {
  const stages = Object.keys(UPLOAD_STAGES) as UploadStage[];
  const currentIndex = stages.indexOf(stage);
  return currentIndex > 0 ? stages[currentIndex - 1] : stage;
};
