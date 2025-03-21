-- Add language fields to File table
ALTER TABLE "File"
ADD COLUMN "language" TEXT,
ADD COLUMN "languageLevel" TEXT,
ADD COLUMN "contentType" TEXT;

-- Comment on columns for documentation
COMMENT ON COLUMN "File"."language" IS 'Language code, e.g. EN (UK), EN (US), RU';
COMMENT ON COLUMN "File"."languageLevel" IS 'Language proficiency level: Beginner, Intermediate, or Advanced';
COMMENT ON COLUMN "File"."contentType" IS 'Type of content: Речь (Speech), Книга (Book), or Рассказ (Story)'; 