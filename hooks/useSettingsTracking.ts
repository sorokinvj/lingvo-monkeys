import { useEffect, useRef } from 'react';
import { useSettings, UserSettings } from '@/hooks/useSettings';
import { useAnalytics } from './useAnalytics';

/**
 * Хук для отслеживания изменений настроек пользователя
 */
export function useSettingsTracking() {
  const { settings } = useSettings();
  const { trackSettingsChange } = useAnalytics();

  // Используем ref для хранения предыдущих настроек
  const prevSettingsRef = useRef<UserSettings | null>(null);

  useEffect(() => {
    // Пропускаем первый рендер
    if (!prevSettingsRef.current) {
      prevSettingsRef.current = settings;
      return;
    }

    // Сравниваем предыдущие и текущие настройки
    const prevSettings = prevSettingsRef.current;

    // Проверяем каждое поле настроек на изменения
    Object.keys(settings).forEach((key) => {
      const typedKey = key as keyof UserSettings;

      // Если значение изменилось
      if (prevSettings[typedKey] !== settings[typedKey]) {
        // Отправляем событие об изменении настройки
        trackSettingsChange({
          settingKey: key,
          oldValue: prevSettings[typedKey],
          newValue: settings[typedKey],
        });
      }
    });

    // Обновляем ref с предыдущими настройками
    prevSettingsRef.current = settings;
  }, [settings, trackSettingsChange]);

  // Этот хук не возвращает никаких значений или функций,
  // так как его основная задача - отслеживание изменений
  return null;
}
