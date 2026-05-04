
CREATE POLICY "Admins can delete goals"
ON public.goals
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
