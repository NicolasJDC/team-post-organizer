CREATE TABLE public.presentation_buttons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  target_status text REFERENCES public.statuses(id) ON DELETE SET NULL,
  is_alteracao boolean NOT NULL DEFAULT false,
  color text NOT NULL DEFAULT '220 85% 60%',
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.presentation_buttons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view presentation buttons"
ON public.presentation_buttons FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert presentation buttons"
ON public.presentation_buttons FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update presentation buttons"
ON public.presentation_buttons FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete presentation buttons"
ON public.presentation_buttons FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Also allow anon to read (for public presentation pages)
CREATE POLICY "Anon can view presentation buttons"
ON public.presentation_buttons FOR SELECT
TO anon
USING (true);