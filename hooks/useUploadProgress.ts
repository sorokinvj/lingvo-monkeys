import { useState, useCallback } from 'react';
import { UPLOAD_STAGES, type UploadStage } from '@/config/constants';

export const useUploadProgress = () => {
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>('');

  const reset = useCallback(() => {
    setProgress(0);
    setMessage('');
  }, []);

  const updateProgress = useCallback(
    (stage: UploadStage, current: number = 100) => {
      const stages = Object.keys(UPLOAD_STAGES) as UploadStage[];
      const currentIndex = stages.indexOf(stage);
      const currentStageValue = UPLOAD_STAGES[stage];
      const prevStageValue =
        currentIndex > 0 ? UPLOAD_STAGES[stages[currentIndex - 1]] : 0;

      if (stage === 'UPLOAD') {
        const uploadStartProgress = UPLOAD_STAGES.PREPARING;
        const uploadEndProgress = UPLOAD_STAGES.UPLOAD;
        const uploadRange = uploadEndProgress - uploadStartProgress;
        setProgress(
          Math.round(uploadStartProgress + (current * uploadRange) / 100)
        );
        return;
      }

      const range = currentStageValue - prevStageValue;
      const calculatedProgress = prevStageValue + (range * current) / 100;
      setProgress(Math.round(calculatedProgress));
    },
    []
  );

  const complete = useCallback(() => {
    reset();
  }, [reset]);

  return {
    progress,
    message,
    setMessage,
    updateProgress,
    reset,
    complete,
  };
};
