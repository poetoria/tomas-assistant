-- Create table for global app settings (shared across all devices)
CREATE TABLE public.global_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  custom_instructions TEXT,
  brand_name TEXT,
  industry TEXT,
  style_guide_content TEXT,
  glossary JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (protected by app password gate)
CREATE POLICY "Anyone can read global settings"
ON public.global_settings
FOR SELECT
USING (true);

-- Allow anyone to update settings (protected by app password gate)
CREATE POLICY "Anyone can update global settings"
ON public.global_settings
FOR UPDATE
USING (true);

-- Allow anyone to insert settings (protected by app password gate)
CREATE POLICY "Anyone can insert global settings"
ON public.global_settings
FOR INSERT
WITH CHECK (true);

-- Insert default row
INSERT INTO public.global_settings (id) VALUES ('default');