
CREATE TABLE public.user_type_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type_id text NOT NULL REFERENCES public.post_types(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, type_id)
);

ALTER TABLE public.user_type_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert type assignments" ON public.user_type_assignments
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete type assignments" ON public.user_type_assignments
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update type assignments" ON public.user_type_assignments
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view type assignments" ON public.user_type_assignments
  FOR SELECT TO authenticated USING (true);
