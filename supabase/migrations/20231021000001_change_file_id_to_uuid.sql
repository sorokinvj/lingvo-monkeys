-- Change File table id to UUID
ALTER TABLE "File" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE "File" ALTER COLUMN id SET DATA TYPE UUID USING (gen_random_uuid());
ALTER TABLE "File" ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Update Transcription table fileId to UUID
ALTER TABLE "Transcription" ALTER COLUMN "fileId" SET DATA TYPE UUID USING (gen_random_uuid());

-- Add foreign key constraint
ALTER TABLE "Transcription" ADD CONSTRAINT "Transcription_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"(id) ON DELETE CASCADE;
