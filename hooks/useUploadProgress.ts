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

  const reset = useCallback(() => {
    setProgress(0);
    setMessage('');
  }, []);

  const updateProgress = useCallback(
    (stage: UploadStage, current: number = 100) => {
      const currentStageValue = UPLOAD_STAGES[stage];
      const prevStageValue =
        stage === 'PRESIGN' ? 0 : UPLOAD_STAGES[getPreviousStage(stage)];

      const calculatedProgress =
        prevStageValue + (current * (currentStageValue - prevStageValue)) / 100;
      setProgress(Math.round(calculatedProgress));
    },
    []
  );

  useEffect(() => {
    if (progress === UPLOAD_STAGES.COMPLETED && onComplete) {
      const timer = setTimeout(() => {
        reset();
        onComplete();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [progress, onComplete, reset]);

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
