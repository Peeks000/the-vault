-- Keep SECURITY DEFINER functions independent of caller-controlled search_path values.
-- The function bodies already use public-qualified application objects.

alter function public.handle_new_user()
  set search_path = '';

alter function public.is_super_admin()
  set search_path = '';

alter function public.update_bid_summary()
  set search_path = '';
