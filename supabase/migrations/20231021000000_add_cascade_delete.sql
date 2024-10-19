-- Drop the existing foreign key constraint
ALTER TABLE "Transcription" 
DROP CONSTRAINT IF EXISTS "Transcription_fileId_fkey";

-- Add the new foreign key constraint with ON DELETE CASCADE
ALTER TABLE "Transcription" 
ADD CONSTRAINT "Transcription_fileId_fkey" 
FOREIGN KEY ("fileId") 
REFERENCES "File"(id) 
ON DELETE CASCADE;
