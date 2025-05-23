# Панель аналитики

## Обзор

Данный документ описывает структуру и функциональность административной панели для просмотра и анализа пользовательской активности в приложении Lingvo Monkeys.

## Разделы панели

### 1. Общая статистика

Основные метрики по использованию приложения:

- Количество активных пользователей (DAU/WAU/MAU)
- Общее время прослушивания файлов
- Количество загруженных файлов
- Среднее время сессии

### 2. Активность пользователей

Подробная информация о действиях конкретных пользователей:

- Список пользователей с возможностью фильтрации
- Детализация активности по конкретному пользователю
- История действий пользователя по дням
- Статистика по прослушиванию файлов

### 3. Статистика по файлам

Аналитика по загруженным и прослушанным файлам:

- Самые популярные файлы
- Частота загрузки файлов разных типов
- Среднее время прослушивания файлов
- Процент завершения прослушивания

### 4. Пользовательские пути

Анализ последовательности действий пользователей:

- Воронки конверсии (от регистрации до загрузки, от загрузки до прослушивания)
- Тепловые карты активности по дням недели и времени суток
- Последовательность страниц

## Технические аспекты

### Запросы для панели

#### Активные пользователи

```sql
-- Ежедневные активные пользователи (DAU)
SELECT
  DATE_TRUNC('day', "createdAt") AS day,
  COUNT(DISTINCT "userId") AS active_users
FROM "UserAction"
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day;
```

#### Статистика прослушивания

```sql
-- Общее время прослушивания по пользователям
SELECT
  "userId",
  SUM("totalListeningTime") AS total_time_seconds
FROM "FilePlaybackStats"
GROUP BY "userId"
ORDER BY total_time_seconds DESC;
```

#### Популярные файлы

```sql
-- Самые прослушиваемые файлы
SELECT
  f."id",
  f."name",
  COUNT(DISTINCT ua."userId") AS unique_listeners,
  COUNT(*) AS play_count
FROM "UserAction" ua
JOIN "File" f ON ua."entityId" = f."id"::TEXT
WHERE
  ua."actionType" = 'playback_start' AND
  ua."entityType" = 'file'
GROUP BY f."id", f."name"
ORDER BY unique_listeners DESC, play_count DESC;
```

### Архитектура панели

Панель аналитики будет реализована как отдельный раздел в административной части приложения:

1. **Фронтенд**:

   - Страница `/admin/analytics` с различными вкладками
   - Использование библиотек визуализации (recharts, d3.js)
   - Фильтрация и выбор временных диапазонов

2. **API-эндпоинты**:

   - `/api/admin/analytics/overview` - общая статистика
   - `/api/admin/analytics/users` - данные по пользователям
   - `/api/admin/analytics/files` - данные по файлам
   - `/api/admin/analytics/pathways` - данные по пользовательским путям

3. **Обновление данных**:
   - Ежедневная агрегация для ускорения запросов
   - Кэширование часто запрашиваемых данных

## Шаги реализации

1. Создание схемы базы данных (таблицы и индексы)
2. Разработка системы сбора данных на клиенте
3. Создание API-маршрутов для получения аналитических данных
4. Реализация интерфейса панели аналитики
5. Настройка прав доступа (только для администраторов)

## Примеры интерфейса

### Общая статистика

```
+-----------------------------------+
|             Общая статистика      |
+-----------------------------------+
| Активные пользователи:            |
|  - Сегодня: 42                    |
|  - За неделю: 156                 |
|  - За месяц: 378                  |
+-----------------------------------+
| Загрузки:                         |
|  - Всего: 1245                    |
|  - За последний месяц: 324        |
+-----------------------------------+
| Прослушивания:                    |
|  - Всего часов: 657               |
|  - Среднее время на файл: 15 мин  |
+-----------------------------------+
```

### График активности

```
   ^
   |                       *
   |                     *   *
   |            *      *       *
   |          *   * *           *
   |        *                    *
   |      *                       *
   |   *                            *
   +---------------------------------->
     Пн   Вт   Ср   Чт   Пт   Сб   Вс
```

## Заключение

Панель аналитики предоставит ценные данные о пользовательском поведении, что поможет:

1. Выявить узкие места и проблемы в приложении
2. Определить популярные функции и контент
3. Принимать обоснованные решения по развитию продукта
