
-- Create presentation_links table
CREATE TABLE public.presentation_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  status_filter text[] DEFAULT NULL,
  date_from date DEFAULT NULL,
  date_to date DEFAULT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.presentation_links ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create links
CREATE POLICY "Authenticated can insert presentation links"
  ON public.presentation_links FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Authenticated users can view their own links
CREATE POLICY "Authenticated can view own presentation links"
  ON public.presentation_links FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can delete their own links
CREATE POLICY "Authenticated can delete own presentation links"
  ON public.presentation_links FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- Security definer function to get presentation by token (public access)
CREATE OR REPLACE FUNCTION public.get_presentation_by_token(_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  link_record presentation_links%ROWTYPE;
  result json;
BEGIN
  SELECT * INTO link_record FROM presentation_links WHERE token = _token;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'not_found');
  END IF;
  
  IF link_record.expires_at IS NOT NULL AND link_record.expires_at < now() THEN
    RETURN json_build_object('error', 'expired');
  END IF;
  
  SELECT json_build_object(
    'link', json_build_object(
      'id', link_record.id,
      'client_id', link_record.client_id,
      'status_filter', link_record.status_filter,
      'date_from', link_record.date_from,
      'date_to', link_record.date_to
    ),
    'client', (SELECT json_build_object('id', c.id, 'nome', c.nome) FROM clients c WHERE c.id = link_record.client_id),
    'posts', COALESCE((
      SELECT json_agg(row_to_json(p) ORDER BY p.data_publicacao)
      FROM posts p
      WHERE p.cliente_id = link_record.client_id
        AND (link_record.status_filter IS NULL OR p.status = ANY(link_record.status_filter))
        AND (link_record.date_from IS NULL OR p.data_publicacao >= link_record.date_from)
        AND (link_record.date_to IS NULL OR p.data_publicacao <= link_record.date_to)
    ), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Index for fast token lookups
CREATE INDEX idx_presentation_links_token ON public.presentation_links(token);
