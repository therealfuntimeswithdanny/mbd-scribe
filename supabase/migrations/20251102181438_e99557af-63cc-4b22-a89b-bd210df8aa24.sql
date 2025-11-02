-- Update calculate_note_size to include media file sizes from data-size attributes
CREATE OR REPLACE FUNCTION public.calculate_note_size(note_content text, note_title text)
RETURNS bigint
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  text_size BIGINT := 0;
  media_size BIGINT := 0;
  matches TEXT[];
  match TEXT;
BEGIN
  -- Calculate text size
  text_size := LENGTH(COALESCE(note_content, '')) + LENGTH(COALESCE(note_title, ''));
  
  -- Extract all data-size attributes from img and video tags
  matches := regexp_matches(note_content, 'data-size="(\d+)"', 'g');
  
  -- Sum up all media sizes
  IF matches IS NOT NULL THEN
    FOREACH match IN ARRAY matches
    LOOP
      media_size := media_size + match::BIGINT;
    END LOOP;
  END IF;
  
  RETURN text_size + media_size;
END;
$$;

-- Create function to manually recalculate user storage
CREATE OR REPLACE FUNCTION public.recalculate_user_storage(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_storage BIGINT := 0;
BEGIN
  -- Calculate total storage from all user's notes
  SELECT COALESCE(SUM(calculate_note_size(content, title)), 0)
  INTO total_storage
  FROM notes
  WHERE user_id = target_user_id;
  
  -- Update profile with calculated storage
  UPDATE profiles
  SET storage_used_bytes = total_storage
  WHERE id = target_user_id;
END;
$$;