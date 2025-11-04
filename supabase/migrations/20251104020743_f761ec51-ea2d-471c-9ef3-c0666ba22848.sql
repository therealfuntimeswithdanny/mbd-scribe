-- Fix favorite limit to only check when toggling to true
CREATE OR REPLACE FUNCTION check_favorite_limit()
RETURNS TRIGGER AS $$
DECLARE
  favorite_count INTEGER;
BEGIN
  -- Only check limit when newly favoriting (not already favorited)
  IF NEW.is_favorited = true AND (TG_OP = 'INSERT' OR OLD.is_favorited = false) THEN
    SELECT COUNT(*) INTO favorite_count
    FROM notes
    WHERE user_id = NEW.user_id AND is_favorited = true AND deleted_at IS NULL AND id != NEW.id;
    
    IF favorite_count >= 10 THEN
      RAISE EXCEPTION 'Favorite limit reached. Maximum 10 favorited notes per user.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;