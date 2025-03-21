import { useRef, useCallback } from 'react';
import { useAnalytics } from './useAnalytics';

// Custom debounce implementation
interface DebouncedFunction<F extends (...args: any[]) => any> {
  (...args: Parameters<F>): void;
  cancel: () => void;
}

function debounce<F extends (...args: any[]) => any>(
  func: F,
  wait: number
): DebouncedFunction<F> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced as DebouncedFunction<F>;
}

interface SettingsChangeOptions {
  debounceMs?: number;
}

export function useSettingsTracker(options: SettingsChangeOptions = {}) {
  const { debounceMs = 500 } = options;
  const { trackSettingsChange } = useAnalytics();

  // Хранение предыдущих значений для слайдеров
  const sliderValuesRef = useRef<Record<string, any>>({});

  // Дебаунсированная функция для обновления настроек
  const debouncedTrackSettingsChange = useRef(
    debounce((key: string, oldValue: any, newValue: any) => {
      trackSettingsChange({
        settingKey: key,
        oldValue,
        newValue,
      });
    }, debounceMs)
  ).current;

  // Функция для отслеживания изменений для слайдеров
  const trackSliderChange = useCallback(
    (key: string, value: any, isFinal: boolean = false) => {
      // Если это первое изменение слайдера, сохраняем начальное значение
      if (sliderValuesRef.current[key] === undefined) {
        sliderValuesRef.current[key] = value;
        return;
      }

      // Если это финальное изменение (отпускание слайдера)
      if (isFinal) {
        const oldValue = sliderValuesRef.current[key];

        // Если значение не изменилось, не отправляем событие
        if (oldValue === value) return;

        // Отправляем событие изменения настроек
        trackSettingsChange({
          settingKey: key,
          oldValue: sliderValuesRef.current[key],
          newValue: value,
        });

        // Обновляем сохраненное значение для будущих изменений
        sliderValuesRef.current[key] = value;

        // Отменяем дебаунсированный вызов, если он был запланирован
        debouncedTrackSettingsChange.cancel();
      }
    },
    [debouncedTrackSettingsChange, trackSettingsChange]
  );

  // Функция для отслеживания обычных изменений настроек (не слайдеры)
  const trackSettingChange = useCallback(
    (key: string, oldValue: any, newValue: any) => {
      // Если значение не изменилось, не отправляем событие
      if (oldValue === newValue) return;

      trackSettingsChange({
        settingKey: key,
        oldValue,
        newValue,
      });
    },
    [trackSettingsChange]
  );

  return {
    trackSettingChange,
    trackSliderChange,
  };
}
