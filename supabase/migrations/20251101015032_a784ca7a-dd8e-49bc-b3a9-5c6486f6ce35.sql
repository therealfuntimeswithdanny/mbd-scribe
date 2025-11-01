-- Fix search_path for all functions
CREATE OR REPLACE FUNCTION calculate_note_size(note_content TEXT, note_title TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN LENGTH(COALESCE(note_content, '')) + LENGTH(COALESCE(note_title, ''));
END;
$$;

CREATE OR REPLACE FUNCTION check_storage_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
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