-- Fast XP increment function
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION increment_xp(user_id UUID, xp_amount INT)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    total_xp = total_xp + xp_amount,
    quests_completed = quests_completed + 1,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
