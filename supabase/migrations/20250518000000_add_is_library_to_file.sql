-- Добавление поля isLibrary в таблицу File
-- Это поле будет использоваться для обозначения файлов, относящихся к библиотеке
ALTER TABLE "File" ADD COLUMN IF NOT EXISTS "is_library" BOOLEAN DEFAULT false;

-- Добавляем комментарий к полю
COMMENT ON COLUMN "File"."is_library" IS 'Указывает, относится ли файл к библиотеке учебных материалов';
