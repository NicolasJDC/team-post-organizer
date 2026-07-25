-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update clients" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete clients" ON public.clients FOR DELETE TO authenticated USING (true);

-- Team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view team_members" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert team_members" ON public.team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update team_members" ON public.team_members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete team_members" ON public.team_members FOR DELETE TO authenticated USING (true);

-- Statuses table
CREATE TABLE public.statuses (
  id TEXT NOT NULL PRIMARY KEY,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '220 85% 60%',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view statuses" ON public.statuses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert statuses" ON public.statuses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update statuses" ON public.statuses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete statuses" ON public.statuses FOR DELETE TO authenticated USING (true);

-- Post types table
CREATE TABLE public.post_types (
  id TEXT NOT NULL PRIMARY KEY,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '220 85% 60%',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.post_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view post_types" ON public.post_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert post_types" ON public.post_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update post_types" ON public.post_types FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete post_types" ON public.post_types FOR DELETE TO authenticated USING (true);

-- Posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  cliente_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  responsavel_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  data_publicacao DATE NOT NULL DEFAULT CURRENT_DATE,
  legenda TEXT DEFAULT '',
  status TEXT REFERENCES public.statuses(id) ON DELETE SET NULL,
  tipo TEXT REFERENCES public.post_types(id) ON DELETE SET NULL,
  artes TEXT[] DEFAULT '{}',
  link_apresentacao TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view posts" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update posts" ON public.posts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete posts" ON public.posts FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for post images
INSERT INTO storage.buckets (id, name, public) VALUES ('post-artes', 'post-artes', true);
CREATE POLICY "Anyone can view post artes" ON storage.objects FOR SELECT USING (bucket_id = 'post-artes');
CREATE POLICY "Authenticated users can upload post artes" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'post-artes');
CREATE POLICY "Authenticated users can update post artes" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'post-artes');
CREATE POLICY "Authenticated users can delete post artes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'post-artes');