-- Update check_note_limit function to support premium users
CREATE OR REPLACE FUNCTION public.check_note_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  note_count INTEGER;
  is_premium BOOLEAN;
  note_limit INTEGER;
BEGIN
  -- Get user's premium status
  SELECT profiles.is_premium INTO is_premium
  FROM profiles
  WHERE profiles.id = NEW.user_id;
  
  -- Set limit based on premium status
  IF is_premium THEN
    note_limit := 200;
  ELSE
    note_limit := 100;
  END IF;
  
  SELECT COUNT(*) INTO note_count
  FROM notes
  WHERE user_id = NEW.user_id AND deleted_at IS NULL;
  
  IF note_count >= note_limit THEN
    RAISE EXCEPTION 'Note limit reached. Maximum % notes per user.', note_limit;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update check_folder_limit function to support premium users
CREATE OR REPLACE FUNCTION public.check_folder_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  folder_count INTEGER;
  is_premium BOOLEAN;
  folder_limit INTEGER;
BEGIN
  -- Get user's premium status
  SELECT profiles.is_premium INTO is_premium
  FROM profiles
  WHERE profiles.id = NEW.user_id;
  
  -- Set limit based on premium status
  IF is_premium THEN
    folder_limit := 20;
  ELSE
    folder_limit := 10;
  END IF;
  
  SELECT COUNT(*) INTO folder_count
  FROM folders
  WHERE user_id = NEW.user_id;
  
  IF folder_count >= folder_limit THEN
    RAISE EXCEPTION 'Folder limit reached. Maximum % folders per user.', folder_limit;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update check_tag_limit function to support premium users
CREATE OR REPLACE FUNCTION public.check_tag_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  tag_count INTEGER;
  is_premium BOOLEAN;
  tag_limit INTEGER;
BEGIN
  -- Get user's premium status
  SELECT profiles.is_premium INTO is_premium
  FROM profiles
  WHERE profiles.id = NEW.user_id;
  
  -- Set limit based on premium status
  IF is_premium THEN
    tag_limit := 100;
  ELSE
    tag_limit := 50;
  END IF;
  
  SELECT COUNT(*) INTO tag_count
  FROM tags
  WHERE user_id = NEW.user_id;
  
  IF tag_count >= tag_limit THEN
    RAISE EXCEPTION 'Tag limit reached. Maximum % tags per user.', tag_limit;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update check_favorite_limit function to support premium users
CREATE OR REPLACE FUNCTION public.check_favorite_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  favorite_count INTEGER;
  is_premium BOOLEAN;
  favorite_limit INTEGER;
BEGIN
  -- Only check limit when newly favoriting (not already favorited)
  IF NEW.is_favorited = true AND (TG_OP = 'INSERT' OR OLD.is_favorited = false) THEN
    -- Get user's premium status
    SELECT profiles.is_premium INTO is_premium
    FROM profiles
    WHERE profiles.id = NEW.user_id;
    
    -- Set limit based on premium status
    IF is_premium THEN
      favorite_limit := 20;
    ELSE
      favorite_limit := 10;
    END IF;
    
    SELECT COUNT(*) INTO favorite_count
    FROM notes
    WHERE user_id = NEW.user_id AND is_favorited = true AND deleted_at IS NULL AND id != NEW.id;
    
    IF favorite_count >= favorite_limit THEN
      RAISE EXCEPTION 'Favorite limit reached. Maximum % favorited notes per user.', favorite_limit;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;