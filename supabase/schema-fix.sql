-- =====================================================
-- IMPACTQUEST DATABASE SCHEMA - FIX VERSION
-- Run this to fix/complete the schema
-- =====================================================

-- Drop existing policies first (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Quests are viewable by everyone" ON public.quests;
DROP POLICY IF EXISTS "Anyone can create quests" ON public.quests;
DROP POLICY IF EXISTS "Quest creators can update their quests" ON public.quests;
DROP POLICY IF EXISTS "Users can view their own quests" ON public.user_quests;
DROP POLICY IF EXISTS "Users can insert their own quest progress" ON public.user_quests;
DROP POLICY IF EXISTS "Users can update their own quest progress" ON public.user_quests;
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.quest_submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON public.quest_submissions;
DROP POLICY IF EXISTS "Service role can update submissions" ON public.quest_submissions;
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON public.badges;
DROP POLICY IF EXISTS "Community stats are viewable by everyone" ON public.community_stats;

-- Enable RLS on all tables (safe to run multiple times)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_stats ENABLE ROW LEVEL SECURITY;

-- Recreate all policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Quests are viewable by everyone" ON public.quests
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create quests" ON public.quests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Quest creators can update their quests" ON public.quests
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can view their own quests" ON public.user_quests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quest progress" ON public.user_quests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quest progress" ON public.user_quests
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own submissions" ON public.quest_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions" ON public.quest_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update submissions" ON public.quest_submissions
    FOR UPDATE USING (true);

CREATE POLICY "Badges are viewable by everyone" ON public.badges
    FOR SELECT USING (true);

CREATE POLICY "Community stats are viewable by everyone" ON public.community_stats
    FOR SELECT USING (true);

-- =====================================================
-- FUNCTIONS & TRIGGERS (DROP FIRST, THEN CREATE)
-- =====================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS on_quest_completion ON public.user_quests;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS calculate_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS get_nearby_quests(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS update_user_stats_on_quest_completion();
DROP FUNCTION IF EXISTS handle_new_user();

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
    R DOUBLE PRECISION := 6371;
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
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        SELECT xp_reward INTO quest_xp FROM public.quests WHERE id = NEW.quest_id;
        
        SELECT total_xp, current_streak, last_quest_date 
        INTO new_total_xp, new_streak, user_last_quest
        FROM public.profiles WHERE id = NEW.user_id;
        
        new_total_xp := new_total_xp + quest_xp;
        NEW.xp_earned := quest_xp;
        
        IF user_last_quest = CURRENT_DATE - INTERVAL '1 day' THEN
            new_streak := new_streak + 1;
        ELSIF user_last_quest != CURRENT_DATE THEN
            new_streak := 1;
        END IF;
        
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
        
        UPDATE public.profiles SET
            total_xp = new_total_xp,
            level = new_level,
            quests_completed = quests_completed + 1,
            current_streak = new_streak,
            longest_streak = GREATEST(longest_streak, new_streak),
            last_quest_date = CURRENT_DATE
        WHERE id = NEW.user_id;
        
        UPDATE public.quests SET times_completed = times_completed + 1 WHERE id = NEW.quest_id;
        
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
-- LEADERBOARD VIEW
-- =====================================================
DROP VIEW IF EXISTS public.leaderboard;

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
-- SAMPLE BADGES DATA
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
-- SAMPLE QUESTS DATA (Nagpur, India based)
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

-- Done!
SELECT 'Schema fix applied successfully! 🎉' as status;
