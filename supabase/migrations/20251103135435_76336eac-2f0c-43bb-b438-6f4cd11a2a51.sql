-- Add favorited and soft delete support to notes
ALTER TABLE public.notes 
ADD COLUMN is_favorited BOOLEAN DEFAULT false,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX idx_notes_favorited ON public.notes(is_favorited) WHERE is_favorited = true;
CREATE INDEX idx_notes_deleted ON public.notes(deleted_at) WHERE deleted_at IS NOT NULL;