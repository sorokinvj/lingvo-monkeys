/**
 * Скрипт для автоматической замены строковых литералов в запросах к Supabase
 * на константы из schema.ts
 *
 * Запуск: node scripts/update-db-references.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Константы и таблицы из schema.ts
const TABLES = {
  User: 'Tables.USER',
  File: 'Tables.FILE',
  Transcription: 'Tables.TRANSCRIPTION',
  PlayerInteractionEvent: 'Tables.PLAYER_EVENT',
  SettingsChangeEvent: 'Tables.SETTINGS_EVENT',
  FileUploadEvent: 'Tables.FILE_UPLOAD_EVENT',
  FileListeningEvent: 'Tables.FILE_LISTENING_EVENT',
  PageViewEvent: 'Tables.PAGE_VIEW_EVENT',
};

// Преобразование колонок в camelCase тоже нужно учесть
const COLUMNS = {
  userId: 'Columns.COMMON.USER_ID',
  fileId: 'Columns.COMMON.FILE_ID',
  createdAt: 'Columns.COMMON.CREATED_AT',
  updatedAt: 'Columns.COMMON.UPDATED_AT',
  // Можно добавить остальные, но пока ограничимся основными
};

// Функция для рекурсивного поиска всех TypeScript файлов
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      findTsFiles(filePath, fileList);
    } else if (
      (file.endsWith('.ts') || file.endsWith('.tsx')) &&
      !file.endsWith('.d.ts') &&
      !filePath.includes('node_modules')
    ) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Функция для проверки, был ли уже импортирован Tables и Columns
function hasSchemaImport(content) {
  return (
    content.includes('import { Tables') ||
    content.includes('import {Tables') ||
    content.includes('import {  Tables')
  );
}

// Функция для добавления импорта, если его нет
function addSchemaImport(content) {
  if (!hasSchemaImport(content)) {
    // Найдем первую строку импорта
    const importRegex = /^import .*/m;
    const match = content.match(importRegex);

    if (match) {
      // Добавим наш импорт после первого импорта
      return content.replace(
        match[0],
        `${match[0]}\nimport { Tables, Columns } from '@/schema/schema';`
      );
    } else {
      // Если импортов нет, добавим в начало файла
      return `import { Tables, Columns } from '@/schema/schema';\n\n${content}`;
    }
  }

  return content;
}

// Функция для замены строковых литералов на константы
function replaceStringLiterals(content) {
  let updated = content;

  // Заменяем таблицы: .from('Table') -> .from(Tables.TABLE)
  Object.entries(TABLES).forEach(([tableName, constant]) => {
    const regex = new RegExp(`\\.from\\(['"]${tableName}['"]\\)`, 'g');
    updated = updated.replace(regex, `.from(${constant})`);
  });

  // Заменяем колонки: .eq('columnName', ...) -> .eq(Columns.TABLE.COLUMN_NAME, ...)
  Object.entries(COLUMNS).forEach(([columnName, constant]) => {
    const regex = new RegExp(`\\.eq\\(['"]${columnName}['"]`, 'g');
    updated = updated.replace(regex, `.eq(${constant}`);
  });

  return updated;
}

// Основная функция
function updateDbReferences() {
  console.log('Ищем TypeScript файлы...');
  const root = path.resolve(__dirname, '..');
  const files = findTsFiles(root);
  console.log(`Найдено ${files.length} TypeScript файлов`);

  let modifiedCount = 0;

  files.forEach((file) => {
    try {
      let content = fs.readFileSync(file, 'utf8');

      // Проверяем, содержит ли файл обращения к Supabase
      if (content.includes('.from(') && content.includes('supabase')) {
        // Сохраняем оригинальное содержимое для сравнения
        const originalContent = content;

        // Добавляем импорт, если нужно
        content = addSchemaImport(content);

        // Заменяем строковые литералы
        content = replaceStringLiterals(content);

        // Если контент изменился, сохраняем файл
        if (content !== originalContent) {
          fs.writeFileSync(file, content, 'utf8');
          modifiedCount++;
          console.log(`Обновлен файл: ${file}`);
        }
      }
    } catch (err) {
      console.error(`Ошибка при обработке файла ${file}:`, err);
    }
  });

  console.log(`\nОбновлено файлов: ${modifiedCount}`);
}

// Запуск основной функции
updateDbReferences();
