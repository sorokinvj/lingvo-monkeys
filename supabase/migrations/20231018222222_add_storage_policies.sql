-- Enable RLS on the storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies for the audio-files bucket
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;

-- Create a policy for authenticated uploads
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'audio-files' AND auth.uid() = owner);

-- Create a policy for authenticated reads
CREATE POLICY "Allow authenticated reads" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'audio-files' AND auth.uid() = owner);

-- Ensure the audio-files bucket exists
INSERT INTO storage.buckets (id, name)
VALUES ('audio-files', 'audio-files')
ON CONFLICT (id) DO NOTHING;
