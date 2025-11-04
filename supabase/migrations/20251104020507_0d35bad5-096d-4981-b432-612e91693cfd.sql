-- Fix search_path for security
CREATE OR REPLACE FUNCTION check_note_limit()
RETURNS TRIGGER AS $$
DECLARE
  note_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO note_count
  FROM notes
  WHERE user_id = NEW.user_id AND deleted_at IS NULL;
  
  IF note_count >= 100 THEN
    RAISE EXCEPTION 'Note limit reached. Maximum 100 notes per user.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION check_folder_limit()
RETURNS TRIGGER AS $$
DECLARE
  folder_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO folder_count
  FROM folders
  WHERE user_id = NEW.user_id;
  
  IF folder_count >= 10 THEN
    RAISE EXCEPTION 'Folder limit reached. Maximum 10 folders per user.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION check_tag_limit()
RETURNS TRIGGER AS $$
DECLARE
  tag_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tag_count
  FROM tags
  WHERE user_id = NEW.user_id;
  
  IF tag_count >= 50 THEN
    RAISE EXCEPTION 'Tag limit reached. Maximum 50 tags per user.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION check_favorite_limit()
RETURNS TRIGGER AS $$
DECLARE
  favorite_count INTEGER;
BEGIN
  IF NEW.is_favorited = true THEN
    SELECT COUNT(*) INTO favorite_count
    FROM notes
    WHERE user_id = NEW.user_id AND is_favorited = true AND deleted_at IS NULL;
    
    IF favorite_count >= 10 THEN
      RAISE EXCEPTION 'Favorite limit reached. Maximum 10 favorited notes per user.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;