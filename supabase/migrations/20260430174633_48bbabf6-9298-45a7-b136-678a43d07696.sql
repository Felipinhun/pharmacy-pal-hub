
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitadora_id UUID NOT NULL,
  prescriber_id UUID REFERENCES public.prescribers(id),
  contact_name TEXT NOT NULL,
  notes TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendado',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visitadoras can view own appointments"
ON public.appointments FOR SELECT TO authenticated
USING (visitadora_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Visitadoras can insert appointments"
ON public.appointments FOR INSERT TO authenticated
WITH CHECK (visitadora_id = auth.uid());

CREATE POLICY "Visitadoras can update own appointments"
ON public.appointments FOR UPDATE TO authenticated
USING (visitadora_id = auth.uid());

CREATE POLICY "Visitadoras can delete own appointments"
ON public.appointments FOR DELETE TO authenticated
USING (visitadora_id = auth.uid());
