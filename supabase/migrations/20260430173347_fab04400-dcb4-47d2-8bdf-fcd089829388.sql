
ALTER TABLE public.visits
  ADD COLUMN latitude double precision,
  ADD COLUMN longitude double precision,
  ADD COLUMN checkin_at timestamp with time zone;
