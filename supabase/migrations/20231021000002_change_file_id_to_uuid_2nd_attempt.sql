-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the foreign key constraint
ALTER TABLE "Transcription" DROP CONSTRAINT IF EXISTS "Transcription_fileId_fkey";

-- Change File table id to UUID
ALTER TABLE "File" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE "File" ALTER COLUMN id SET DATA TYPE UUID USING (uuid_generate_v4());
ALTER TABLE "File" ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Drop the old sequence if it exists
DROP SEQUENCE IF EXISTS "File_id_seq";

-- Update Transcription table fileId to UUID
ALTER TABLE "Transcription" ALTER COLUMN "fileId" SET DATA TYPE UUID USING (uuid_generate_v4());

-- Recreate the foreign key constraint
ALTER TABLE "Transcription" ADD CONSTRAINT "Transcription_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"(id) ON DELETE CASCADE;

-- Update existing data in Transcription table to match File ids
UPDATE "Transcription" t
SET "fileId" = f.id
FROM "File" f
WHERE t."fileId"::text = f.id::text;