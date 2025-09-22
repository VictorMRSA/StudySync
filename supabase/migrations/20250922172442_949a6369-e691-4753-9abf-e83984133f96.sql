-- Create a SECURITY DEFINER RPC to update error report status safely
CREATE OR REPLACE FUNCTION public.mark_error_report_status(report_id uuid, new_status text)
RETURNS TABLE (id uuid, status text, resolved_at timestamptz, resolved_by uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure only admins can run it
  IF NOT public.is_user_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Update the report and return the updated fields
  RETURN QUERY
  UPDATE public.error_reports AS er
  SET
    status = new_status,
    resolved_at = CASE WHEN new_status = 'resolvido' THEN now() ELSE NULL END,
    resolved_by = CASE WHEN new_status = 'resolvido' THEN auth.uid() ELSE NULL END
  WHERE er.id = report_id
  RETURNING er.id, er.status, er.resolved_at, er.resolved_by;
END;
$$;