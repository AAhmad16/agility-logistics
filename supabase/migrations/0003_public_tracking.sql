-- Public tracking by waybill: status and timeline only, no private addresses.
create function public.track_shipment(p_waybill text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'waybill', s.waybill, 'status', s.status, 'service', s.service,
    'pickup', case when a.is_hub then a.name else 'Pickup location' end,
    'dropoff', case when b.is_hub then b.name else 'Delivery location' end,
    'events', coalesce((select jsonb_agg(jsonb_build_object('kind', e.kind, 'at', e.created_at) order by e.created_at)
                        from public.shipment_events e where e.shipment_id = s.id), '[]'::jsonb))
  from public.shipments s
  join public.locations a on a.id = s.pickup_id
  join public.locations b on b.id = s.dropoff_id
  where upper(s.waybill) = upper(trim(p_waybill))
$$;
revoke execute on function public.track_shipment(text) from public;
grant execute on function public.track_shipment(text) to anon, authenticated;
