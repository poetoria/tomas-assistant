
CREATE TABLE public.style_guide_gaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_query TEXT NOT NULL,
  tomas_response TEXT NOT NULL,
  confidence_signal TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'added')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.style_guide_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read gaps" ON public.style_guide_gaps FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert gaps" ON public.style_guide_gaps FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update gaps" ON public.style_guide_gaps FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete gaps" ON public.style_guide_gaps FOR DELETE TO public USING (true);

CREATE TABLE public.supplemental_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_text TEXT NOT NULL,
  source_gap_id UUID REFERENCES public.style_guide_gaps(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.supplemental_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read supplemental rules" ON public.supplemental_rules FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert supplemental rules" ON public.supplemental_rules FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update supplemental rules" ON public.supplemental_rules FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete supplemental rules" ON public.supplemental_rules FOR DELETE TO public USING (true);
