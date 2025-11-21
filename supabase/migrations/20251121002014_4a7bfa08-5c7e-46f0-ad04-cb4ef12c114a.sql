-- Add pinning and archiving support to conversations
ALTER TABLE public.conversations 
ADD COLUMN is_pinned_by_buyer boolean DEFAULT false,
ADD COLUMN is_pinned_by_seller boolean DEFAULT false,
ADD COLUMN is_archived_by_buyer boolean DEFAULT false,
ADD COLUMN is_archived_by_seller boolean DEFAULT false;