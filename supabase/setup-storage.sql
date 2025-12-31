-- =====================================================
-- STORAGE BUCKET SETUP
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create the quest-proofs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('quest-proofs', 'quest-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to the bucket
CREATE POLICY "Users can upload quest proofs" ON storage.objects
FOR INSERT 
WITH CHECK (
    bucket_id = 'quest-proofs' 
    AND auth.role() = 'authenticated'
);

-- Allow public read access
CREATE POLICY "Public read access for quest proofs" ON storage.objects
FOR SELECT 
USING (bucket_id = 'quest-proofs');

-- Allow users to update/delete their own files
CREATE POLICY "Users can manage their own proofs" ON storage.objects
FOR ALL 
USING (
    bucket_id = 'quest-proofs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
    bucket_id = 'quest-proofs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

SELECT 'Storage bucket created successfully!' as status;
