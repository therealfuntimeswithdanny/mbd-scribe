-- Add premium status to profiles table
ALTER TABLE public.profiles ADD COLUMN is_premium boolean NOT NULL DEFAULT false;

-- Add upgraded_at timestamp to track when user upgraded
ALTER TABLE public.profiles ADD COLUMN upgraded_at timestamp with time zone;