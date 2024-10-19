-- Add status column to File table
ALTER TABLE "File" ADD COLUMN "status" TEXT CHECK ("status" IN ('pending', 'transcribing', 'transcribed', 'error')) NOT NULL DEFAULT 'pending';

-- Add transcriptionId column to File table
ALTER TABLE "File" ADD COLUMN "transcriptionId" UUID;

-- Change Transcription id to UUID
ALTER TABLE "Transcription" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "Transcription" ALTER COLUMN "id" SET DATA TYPE UUID USING (gen_random_uuid());
ALTER TABLE "Transcription" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Add foreign key constraint from File to Transcription
ALTER TABLE "File" ADD CONSTRAINT "File_transcriptionId_fkey" FOREIGN KEY ("transcriptionId") REFERENCES "Transcription"("id");
