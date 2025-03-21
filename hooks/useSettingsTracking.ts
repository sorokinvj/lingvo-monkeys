import { useEffect, useRef } from 'react';
import { useSettings, UserSettings } from '@/hooks/useSettings';
import { useAnalytics } from './useAnalytics';

/**
 * Простая реализация debounce без внешних зависимостей
 */
function createDebouncer(delay: number = 500) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (func: Function) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func();
      timeoutId = null;
    }, delay);
  };
}

/**
 * Хук для отслеживания изменений настроек пользователя
 */
export function useSettingsTracking() {
  const { settings } = useSettings();
  const { trackSettingsChange } = useAnalytics();

  // Используем ref для хранения предыдущих настроек
  const prevSettingsRef = useRef<UserSettings | null>(null);

  // Общий debouncer для всех настроек
  const debouncerRef = useRef(createDebouncer(500));

  // Храним только последнее значение для каждого ключа
  const pendingChangesRef = useRef<
    Record<
      string,
      {
        originalValue: any;
        currentValue: any;
      }
    >
  >({});

  useEffect(() => {
    // Инициализируем предыдущие настройки при первом рендере
    if (!prevSettingsRef.current) {
      prevSettingsRef.current = { ...settings };
      return;
    }

    // Сравниваем предыдущие и текущие настройки
    const prevSettings = prevSettingsRef.current;
    let hasChanges = false;

    // Проверяем каждое поле настроек на изменения
    Object.keys(settings).forEach((key) => {
      const typedKey = key as keyof UserSettings;

      // Если значение изменилось
      if (prevSettings[typedKey] !== settings[typedKey]) {
        // Если это первое изменение настройки, сохраняем оригинальное значение
        if (!pendingChangesRef.current[key]) {
          pendingChangesRef.current[key] = {
            originalValue: prevSettings[typedKey],
            currentValue: settings[typedKey],
          };
        } else {
          // Иначе обновляем только текущее значение
          pendingChangesRef.current[key].currentValue = settings[typedKey];
        }
        hasChanges = true;
      }
    });

    // Если есть изменения, дебаунсим их отправку
    if (hasChanges) {
      debouncerRef.current(() => {
        // Отправляем только одно событие для каждой настройки
        Object.entries(pendingChangesRef.current).forEach(([key, change]) => {
          trackSettingsChange({
            settingKey: key,
            oldValue: change.originalValue,
            newValue: change.currentValue,
          });
        });

        // Очищаем объект изменений
        pendingChangesRef.current = {};
      });
    }

    // Обновляем ref с предыдущими настройками
    prevSettingsRef.current = { ...settings };
  }, [settings, trackSettingsChange]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      // Отправляем все отложенные изменения при размонтировании
      Object.entries(pendingChangesRef.current).forEach(([key, change]) => {
        trackSettingsChange({
          settingKey: key,
          oldValue: change.originalValue,
          newValue: change.currentValue,
        });
      });
    };
  }, [trackSettingsChange]);

  // Этот хук не возвращает никаких значений или функций,
  // так как его основная задача - отслеживание изменений
  return null;
}
