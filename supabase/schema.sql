-- =====================================================
-- IMPACTQUEST DATABASE SCHEMA
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (User data with gamification)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    quests_completed INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_quest_date DATE,
    badges TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON public.profiles(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON public.profiles(level DESC);

-- =====================================================
-- 2. QUESTS TABLE (Available quests/challenges)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('environment', 'elderly_care', 'food_rescue', 'education', 'community')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    xp_reward INTEGER NOT NULL DEFAULT 25,
    estimated_time INTEGER NOT NULL DEFAULT 15, -- in minutes
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    requirements TEXT[] DEFAULT '{}',
    verification_criteria TEXT[] DEFAULT '{}',
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    times_completed INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Create indexes for geolocation queries
CREATE INDEX IF NOT EXISTS idx_quests_location ON public.quests(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_quests_category ON public.quests(category);
CREATE INDEX IF NOT EXISTS idx_quests_active ON public.quests(is_active) WHERE is_active = TRUE;

-- =====================================================
-- 3. USER_QUESTS TABLE (Quest progress tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'in_progress', 'submitted', 'completed', 'failed')),
    accepted_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    xp_earned INTEGER DEFAULT 0,
    UNIQUE(user_id, quest_id)
);

CREATE INDEX IF NOT EXISTS idx_user_quests_user ON public.user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_status ON public.user_quests(status);

-- =====================================================
-- 4. QUEST_SUBMISSIONS TABLE (Photo proof & verification)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quest_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
    user_quest_id UUID NOT NULL REFERENCES public.user_quests(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_hash TEXT,
    submitted_latitude DOUBLE PRECISION NOT NULL,
    submitted_longitude DOUBLE PRECISION NOT NULL,
    ai_confidence INTEGER DEFAULT 0,
    ai_labels TEXT[] DEFAULT '{}',
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    rejection_reason TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_user ON public.quest_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.quest_submissions(verification_status);

-- =====================================================
-- 5. BADGES TABLE (Achievement definitions)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT NOT NULL, -- emoji or icon name
    category TEXT NOT NULL,
    requirement_type TEXT NOT NULL CHECK (requirement_type IN ('quests_completed', 'xp_earned', 'streak', 'category_specific')),
    requirement_value INTEGER NOT NULL,
    requirement_category TEXT,
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. COMMUNITY_STATS TABLE (Global impact metrics)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.community_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    total_quests_completed INTEGER DEFAULT 0,
    total_trash_collected_kg DECIMAL(10,2) DEFAULT 0,
    total_trees_planted INTEGER DEFAULT 0,
    total_elderly_helped INTEGER DEFAULT 0,
    total_meals_rescued INTEGER DEFAULT 0,
    total_hours_volunteered DECIMAL(10,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial community stats row
INSERT INTO public.community_stats (id) VALUES (uuid_generate_v4()) ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_stats ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Quests policies (everyone can view, only admins can create/update)
CREATE POLICY "Quests are viewable by everyone" ON public.quests
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create quests" ON public.quests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Quest creators can update their quests" ON public.quests
    FOR UPDATE USING (auth.uid() = created_by);

-- User quests policies
CREATE POLICY "Users can view their own quests" ON public.user_quests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quest progress" ON public.user_quests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quest progress" ON public.user_quests
    FOR UPDATE USING (auth.uid() = user_id);

-- Quest submissions policies
CREATE POLICY "Users can view their own submissions" ON public.quest_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions" ON public.quest_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update submissions" ON public.quest_submissions
    FOR UPDATE USING (true);

-- Badges policies (everyone can view)
CREATE POLICY "Badges are viewable by everyone" ON public.badges
    FOR SELECT USING (true);

-- Community stats policies (everyone can view)
CREATE POLICY "Community stats are viewable by everyone" ON public.community_stats
    FOR SELECT USING (true);

-- =====================================================
-- 8. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update profile updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate distance between two coordinates (in km)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    R DOUBLE PRECISION := 6371; -- Earth radius in km
    dlat DOUBLE PRECISION;
    dlon DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
BEGIN
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    RETURN R * c;
END;
$$ LANGUAGE plpgsql;

-- Function to get nearby quests
CREATE OR REPLACE FUNCTION get_nearby_quests(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    category TEXT,
    difficulty TEXT,
    xp_reward INTEGER,
    estimated_time INTEGER,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address TEXT,
    image_url TEXT,
    is_featured BOOLEAN,
    times_completed INTEGER,
    distance_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.title,
        q.description,
        q.category,
        q.difficulty,
        q.xp_reward,
        q.estimated_time,
        q.latitude,
        q.longitude,
        q.address,
        q.image_url,
        q.is_featured,
        q.times_completed,
        calculate_distance(user_lat, user_lng, q.latitude, q.longitude) as distance_km
    FROM public.quests q
    WHERE q.is_active = TRUE
        AND (q.expires_at IS NULL OR q.expires_at > NOW())
        AND calculate_distance(user_lat, user_lng, q.latitude, q.longitude) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to update user XP and level after quest completion
CREATE OR REPLACE FUNCTION update_user_stats_on_quest_completion()
RETURNS TRIGGER AS $$
DECLARE
    quest_xp INTEGER;
    new_total_xp INTEGER;
    new_level INTEGER;
    user_last_quest DATE;
    new_streak INTEGER;
BEGIN
    -- Only process when status changes to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Get quest XP reward
        SELECT xp_reward INTO quest_xp FROM public.quests WHERE id = NEW.quest_id;
        
        -- Get current user stats
        SELECT total_xp, current_streak, last_quest_date 
        INTO new_total_xp, new_streak, user_last_quest
        FROM public.profiles WHERE id = NEW.user_id;
        
        -- Calculate new XP
        new_total_xp := new_total_xp + quest_xp;
        NEW.xp_earned := quest_xp;
        
        -- Calculate streak
        IF user_last_quest = CURRENT_DATE - INTERVAL '1 day' THEN
            new_streak := new_streak + 1;
        ELSIF user_last_quest != CURRENT_DATE THEN
            new_streak := 1;
        END IF;
        
        -- Calculate new level (XP thresholds: 100, 250, 450, 700, 1000...)
        new_level := 1;
        IF new_total_xp >= 100 THEN new_level := 2; END IF;
        IF new_total_xp >= 250 THEN new_level := 3; END IF;
        IF new_total_xp >= 450 THEN new_level := 4; END IF;
        IF new_total_xp >= 700 THEN new_level := 5; END IF;
        IF new_total_xp >= 1000 THEN new_level := 6; END IF;
        IF new_total_xp >= 1400 THEN new_level := 7; END IF;
        IF new_total_xp >= 1900 THEN new_level := 8; END IF;
        IF new_total_xp >= 2500 THEN new_level := 9; END IF;
        IF new_total_xp >= 3200 THEN new_level := 10; END IF;
        IF new_total_xp >= 4000 THEN new_level := 11 + ((new_total_xp - 4000) / 1000); END IF;
        
        -- Update user profile
        UPDATE public.profiles SET
            total_xp = new_total_xp,
            level = new_level,
            quests_completed = quests_completed + 1,
            current_streak = new_streak,
            longest_streak = GREATEST(longest_streak, new_streak),
            last_quest_date = CURRENT_DATE
        WHERE id = NEW.user_id;
        
        -- Update quest completion count
        UPDATE public.quests SET times_completed = times_completed + 1 WHERE id = NEW.quest_id;
        
        -- Update community stats
        UPDATE public.community_stats SET
            total_quests_completed = total_quests_completed + 1,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_quest_completion
    BEFORE UPDATE ON public.user_quests
    FOR EACH ROW EXECUTE FUNCTION update_user_stats_on_quest_completion();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 9. LEADERBOARD VIEW
-- =====================================================
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
    id as user_id,
    username,
    avatar_url,
    total_xp,
    level,
    quests_completed,
    current_streak,
    ROW_NUMBER() OVER (ORDER BY total_xp DESC) as rank
FROM public.profiles
WHERE quests_completed > 0
ORDER BY total_xp DESC
LIMIT 100;

-- =====================================================
-- 10. SAMPLE BADGES DATA
-- =====================================================
INSERT INTO public.badges (name, description, icon, category, requirement_type, requirement_value, rarity) VALUES
    ('First Steps', 'Complete your first quest', '🎯', 'general', 'quests_completed', 1, 'common'),
    ('Questioner', 'Complete 5 quests', '⭐', 'general', 'quests_completed', 5, 'common'),
    ('Quest Master', 'Complete 25 quests', '🏆', 'general', 'quests_completed', 25, 'rare'),
    ('Legend', 'Complete 100 quests', '👑', 'general', 'quests_completed', 100, 'legendary'),
    ('XP Hunter', 'Earn 500 XP', '💎', 'xp', 'xp_earned', 500, 'common'),
    ('XP Champion', 'Earn 2000 XP', '💰', 'xp', 'xp_earned', 2000, 'rare'),
    ('On Fire', '3 day streak', '🔥', 'streak', 'streak', 3, 'common'),
    ('Unstoppable', '7 day streak', '⚡', 'streak', 'streak', 7, 'rare'),
    ('Dedicated', '30 day streak', '🌟', 'streak', 'streak', 30, 'epic'),
    ('Eco Warrior', 'Complete 10 environment quests', '🌱', 'environment', 'category_specific', 10, 'rare'),
    ('Elder Friend', 'Complete 10 elderly care quests', '👴', 'elderly_care', 'category_specific', 10, 'rare'),
    ('Food Hero', 'Complete 10 food rescue quests', '🍽️', 'food_rescue', 'category_specific', 10, 'rare')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 11. SAMPLE QUESTS DATA (Nagpur, India based)
-- =====================================================
INSERT INTO public.quests (title, description, category, difficulty, xp_reward, estimated_time, latitude, longitude, address, requirements, verification_criteria, is_active, is_featured) VALUES
    ('Clean Futala Lake', 'Pick up at least 10 pieces of trash around Futala Lake. Help keep our beautiful lake clean!', 'environment', 'easy', 25, 15, 21.1458, 79.0882, 'Futala Lake, Nagpur', ARRAY['Trash bag', 'Gloves (optional)'], ARRAY['Photo showing collected trash', 'Location within 50m of lake'], TRUE, TRUE),
    ('Ambazari Garden Cleanup', 'Collect litter and plastic waste from Ambazari Garden paths', 'environment', 'easy', 30, 20, 21.1265, 79.0442, 'Ambazari Garden, Nagpur', ARRAY['Trash bag'], ARRAY['Photo of collected waste'], TRUE, FALSE),
    ('Help at Deekshabhoomi', 'Assist elderly visitors at Deekshabhoomi with directions or carrying items', 'elderly_care', 'medium', 50, 30, 21.1392, 79.0756, 'Deekshabhoomi, Nagpur', ARRAY['Patience', 'Respectful attitude'], ARRAY['Photo with elderly person (with consent)', 'Description of help provided'], TRUE, FALSE),
    ('Seminary Hills Tree Care', 'Water young saplings at Seminary Hills or report any that need attention', 'environment', 'easy', 20, 15, 21.1520, 79.0780, 'Seminary Hills, Nagpur', ARRAY['Water bottle or container'], ARRAY['Photo of watered plants'], TRUE, FALSE),
    ('Food Rescue - Sitabuldi', 'Collect excess food from restaurants in Sitabuldi and deliver to nearby shelter', 'food_rescue', 'hard', 75, 45, 21.1466, 79.0817, 'Sitabuldi Market, Nagpur', ARRAY['Food container', 'Transportation'], ARRAY['Photo of food collection', 'Delivery confirmation'], TRUE, TRUE),
    ('Dharampeth Library Help', 'Help organize books or assist visitors at the local library', 'education', 'easy', 25, 20, 21.1391, 79.0654, 'Dharampeth, Nagpur', ARRAY['None'], ARRAY['Photo at library', 'Brief description'], TRUE, FALSE),
    ('Kasturchand Park Cleanup', 'Morning cleanup drive at Kasturchand Park', 'environment', 'medium', 40, 25, 21.1469, 79.0955, 'Kasturchand Park, Nagpur', ARRAY['Trash bag', 'Early morning availability'], ARRAY['Photo of cleaned area'], TRUE, FALSE),
    ('Senior Citizen Tech Help', 'Teach a senior citizen to use smartphone basics (WhatsApp, calling, photos)', 'elderly_care', 'medium', 60, 45, 21.1458, 79.0882, 'Any location in Nagpur', ARRAY['Smartphone knowledge', 'Patience'], ARRAY['Photo with learner', 'Skills taught description'], TRUE, FALSE),
    ('Zero Mile Book Donation', 'Donate at least 3 books at the community book exchange near Zero Mile', 'education', 'easy', 30, 15, 21.1535, 79.0825, 'Zero Mile, Nagpur', ARRAY['3+ books to donate'], ARRAY['Photo of donated books'], TRUE, FALSE),
    ('Mankapur Dog Shelter Help', 'Volunteer at the local dog shelter - feeding, cleaning, or walking dogs', 'community', 'medium', 50, 60, 21.1800, 79.0500, 'Mankapur, Nagpur', ARRAY['Comfortable clothes', 'Love for animals'], ARRAY['Photo at shelter'], TRUE, FALSE)
ON CONFLICT DO NOTHING;
