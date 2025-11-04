-- Remove storage-based system and add count-based limits

-- Drop triggers first
DROP TRIGGER IF EXISTS track_note_storage ON notes;
DROP TRIGGER IF EXISTS update_note_storage ON notes;
DROP TRIGGER IF EXISTS check_storage_limit_trigger ON notes;

-- Drop functions with CASCADE
DROP FUNCTION IF EXISTS update_user_storage() CASCADE;
DROP FUNCTION IF EXISTS check_storage_limit() CASCADE;
DROP FUNCTION IF EXISTS calculate_note_size(text, text) CASCADE;
DROP FUNCTION IF EXISTS recalculate_user_storage(uuid) CASCADE;

-- Remove storage column from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS storage_used_bytes;

-- Add count limit check functions
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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER check_note_limit_trigger
BEFORE INSERT ON notes
FOR EACH ROW
EXECUTE FUNCTION check_note_limit();

CREATE TRIGGER check_folder_limit_trigger
BEFORE INSERT ON folders
FOR EACH ROW
EXECUTE FUNCTION check_folder_limit();

CREATE TRIGGER check_tag_limit_trigger
BEFORE INSERT ON tags
FOR EACH ROW
EXECUTE FUNCTION check_tag_limit();

CREATE TRIGGER check_favorite_limit_trigger
BEFORE INSERT OR UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION check_favorite_limit();