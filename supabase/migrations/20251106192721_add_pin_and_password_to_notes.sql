-- Add pin and password protection support to notes
ALTER TABLE public.notes 
ADD COLUMN is_pinned BOOLEAN DEFAULT false,
ADD COLUMN password_hash TEXT DEFAULT NULL,
ADD COLUMN last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX idx_notes_pinned ON public.notes(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_notes_last_viewed ON public.notes(last_viewed_at) WHERE last_viewed_at IS NOT NULL;

