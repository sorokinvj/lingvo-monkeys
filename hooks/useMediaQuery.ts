import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  // Проверяем, находимся ли мы на клиенте (в браузере)
  const getMatches = (query: string): boolean => {
    // Предотвращаем ошибки SSR
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches(query));

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Обработчик изменения медиа-запроса
    const handleChange = () => setMatches(mediaQuery.matches);

    // Добавляем слушатель
    mediaQuery.addEventListener('change', handleChange);

    // Устанавливаем начальное значение
    handleChange();

    // Очищаем слушатель при размонтировании
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}
