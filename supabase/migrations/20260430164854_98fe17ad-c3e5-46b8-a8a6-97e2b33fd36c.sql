
-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('visitadora', 'prescritor', 'atendente', 'admin');

-- Enum for partnership potential
CREATE TYPE public.partnership_potential AS ENUM ('baixo', 'medio', 'alto');

-- User roles table (separate from profiles per security best practices)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Prescribers table (registered by visitadoras)
CREATE TABLE public.prescribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitadora_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prescritor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  street TEXT,
  number TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT DEFAULT 'SP',
  zip_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  specialty TEXT,
  crm_crf TEXT,
  clinic_name TEXT,
  specialization TEXT,
  partnership_potential partnership_potential DEFAULT 'medio',
  best_visit_day TEXT,
  best_visit_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prescribers ENABLE ROW LEVEL SECURITY;

-- Visits table
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitadora_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prescriber_id UUID REFERENCES public.prescribers(id) ON DELETE CASCADE NOT NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescriber_id UUID REFERENCES public.prescribers(id) ON DELETE SET NULL,
  atendente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Goals/competitions table (structure for future criteria)
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL DEFAULT 'sales_amount',
  target_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  target_role app_role NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Achievements / gamification
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  badge_icon TEXT DEFAULT 'trophy',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles: users can read own, admins can read all
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- User roles: admins can manage, users can read own
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Prescribers: visitadoras can manage own, admins can see all
CREATE POLICY "Visitadoras can view own prescribers" ON public.prescribers
  FOR SELECT TO authenticated
  USING (visitadora_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR prescritor_user_id = auth.uid());

CREATE POLICY "Visitadoras can insert prescribers" ON public.prescribers
  FOR INSERT TO authenticated
  WITH CHECK (visitadora_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Visitadoras can update own prescribers" ON public.prescribers
  FOR UPDATE TO authenticated
  USING (visitadora_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Visits: visitadoras can manage own, admins can see all
CREATE POLICY "Visitadoras can view own visits" ON public.visits
  FOR SELECT TO authenticated
  USING (visitadora_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Visitadoras can insert visits" ON public.visits
  FOR INSERT TO authenticated
  WITH CHECK (visitadora_id = auth.uid());

CREATE POLICY "Visitadoras can update own visits" ON public.visits
  FOR UPDATE TO authenticated
  USING (visitadora_id = auth.uid());

-- Sales: atendentes can see own, prescribers can see theirs, admins see all
CREATE POLICY "Users can view relevant sales" ON public.sales
  FOR SELECT TO authenticated
  USING (
    atendente_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.prescribers p
      WHERE p.id = prescriber_id AND (p.prescritor_user_id = auth.uid() OR p.visitadora_id = auth.uid())
    )
  );

CREATE POLICY "Admins and atendentes can insert sales" ON public.sales
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'));

CREATE POLICY "Admins can update sales" ON public.sales
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Goals: all authenticated can read, admins can manage
CREATE POLICY "All can view goals" ON public.goals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage goals" ON public.goals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Achievements: users can see own, admins can see all
CREATE POLICY "Users can view own achievements" ON public.achievements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage achievements" ON public.achievements
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
