
CREATE TABLE public.user_status_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status_id text NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, status_id)
);

ALTER TABLE public.user_status_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert status assignments" ON public.user_status_assignments
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete status assignments" ON public.user_status_assignments
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update status assignments" ON public.user_status_assignments
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view status assignments" ON public.user_status_assignments
  FOR SELECT TO authenticated USING (true);
