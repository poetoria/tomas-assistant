
-- Add style_guide_urls column
ALTER TABLE public.global_settings 
ADD COLUMN IF NOT EXISTS style_guide_urls jsonb DEFAULT '[]'::jsonb;

-- Seed the default row if it doesn't exist
INSERT INTO public.global_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;
