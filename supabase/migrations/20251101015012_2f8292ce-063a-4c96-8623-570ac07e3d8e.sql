-- Add storage tracking to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 0;

-- Create function to calculate note size
CREATE OR REPLACE FUNCTION calculate_note_size(note_content TEXT, note_title TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN LENGTH(COALESCE(note_content, '')) + LENGTH(COALESCE(note_title, ''));
END;
$$;

-- Create function to update user storage
CREATE OR REPLACE FUNCTION update_user_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_size BIGINT := 0;
  new_size BIGINT := 0;
  user_id_val UUID;
BEGIN
  -- Determine user_id based on operation
  IF TG_OP = 'DELETE' THEN
    user_id_val := OLD.user_id;
    old_size := calculate_note_size(OLD.content, OLD.title);
  ELSIF TG_OP = 'UPDATE' THEN
    user_id_val := NEW.user_id;
    old_size := calculate_note_size(OLD.content, OLD.title);
    new_size := calculate_note_size(NEW.content, NEW.title);
  ELSIF TG_OP = 'INSERT' THEN
    user_id_val := NEW.user_id;
    new_size := calculate_note_size(NEW.content, NEW.title);
  END IF;

  -- Update storage used
  UPDATE profiles
  SET storage_used_bytes = GREATEST(0, storage_used_bytes - old_size + new_size)
  WHERE id = user_id_val;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger for storage tracking
DROP TRIGGER IF EXISTS track_note_storage ON notes;
CREATE TRIGGER track_note_storage
AFTER INSERT OR UPDATE OR DELETE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_user_storage();

-- Create function to check storage limit before insert/update
CREATE OR REPLACE FUNCTION check_storage_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_storage BIGINT;
  new_size BIGINT;
  old_size BIGINT := 0;
  storage_limit BIGINT := 524288000; -- 500MB in bytes
BEGIN
  -- Calculate sizes
  new_size := calculate_note_size(NEW.content, NEW.title);
  
  IF TG_OP = 'UPDATE' THEN
    old_size := calculate_note_size(OLD.content, OLD.title);
  END IF;

  -- Get current storage
  SELECT storage_used_bytes INTO current_storage
  FROM profiles
  WHERE id = NEW.user_id;

  -- Check if new note would exceed limit
  IF (COALESCE(current_storage, 0) - old_size + new_size) > storage_limit THEN
    RAISE EXCEPTION 'Storage limit exceeded. Maximum 500MB per user.';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to check storage before insert/update
DROP TRIGGER IF EXISTS check_storage_before_save ON notes;
CREATE TRIGGER check_storage_before_save
BEFORE INSERT OR UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION check_storage_limit();