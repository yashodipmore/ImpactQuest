-- =====================================================
-- FIX: Create profiles for existing auth users
-- Run this in Supabase SQL Editor
-- =====================================================

-- This will create profiles for any auth users who don't have one
INSERT INTO public.profiles (id, email, username)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1))
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Check if profiles were created
SELECT id, email, username, total_xp, level FROM public.profiles;
