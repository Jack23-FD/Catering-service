-- ==============================================================================
-- CATERING WORKER BOOKING PLATFORM: COMPLETE ADVANCED SCHEMA & UPGRADES
-- ==============================================================================

-- 1. Upgrade Profiles Table with Address, Phone, Photo, and Email
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('worker', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. Create or Upgrade Events Table (Admin-Entered Data)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  place TEXT NOT NULL,
  food TEXT NOT NULL DEFAULT 'Catering Service',
  days INTEGER NOT NULL DEFAULT 1,
  hours TEXT NOT NULL DEFAULT 'Standard Shift',
  salary NUMERIC,
  salary_unit TEXT DEFAULT 'day',
  venue_map_url TEXT,
  collaborator TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'current', 'past')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Upgrade existing events table if already created
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS salary NUMERIC;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS salary_unit TEXT DEFAULT 'day';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS member_count INTEGER NOT NULL DEFAULT 5;

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

-- 3. Create Event Assignments (Links Workers to Requested & Confirmed Events)
CREATE TABLE IF NOT EXISTS public.event_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(event_id, worker_id)
);

-- Upgrade existing constraint if table already created
ALTER TABLE public.event_assignments DROP CONSTRAINT IF EXISTS event_assignments_status_check;
ALTER TABLE public.event_assignments ADD CONSTRAINT event_assignments_status_check CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_assignments_worker ON public.event_assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_assignments_event ON public.event_assignments(event_id);

-- 4. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Security Definer Admin Check Function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- RLS POLICIES
DROP POLICY IF EXISTS "All authenticated users can view events" ON public.events;
CREATE POLICY "All authenticated users can view events"
  ON public.events FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view their own assignments" ON public.event_assignments;
DROP POLICY IF EXISTS "All authenticated users can view assignments" ON public.event_assignments;
CREATE POLICY "All authenticated users can view assignments"
  ON public.event_assignments FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Workers can claim shifts" ON public.event_assignments;
CREATE POLICY "Workers can claim shifts"
  ON public.event_assignments FOR INSERT TO authenticated
  WITH CHECK (worker_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update assignments" ON public.event_assignments;
CREATE POLICY "Admins can update assignments"
  ON public.event_assignments FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Workers can unclaim shifts" ON public.event_assignments;
CREATE POLICY "Workers can unclaim shifts"
  ON public.event_assignments FOR DELETE TO authenticated
  USING (worker_id = auth.uid() OR public.is_admin());
