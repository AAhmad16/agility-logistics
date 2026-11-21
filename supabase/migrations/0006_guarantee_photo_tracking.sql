-- On-time guarantee, photo proof of delivery, secret tracking links, driver info on tracking.

alter table public.shipments
  add column eta_minutes integer,
  add column promised_at timestamptz,
  add column late_credit_cents integer not null default 0,
  add column pod_photo text,
  add column track_token text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);

-- Credit given when a delivery misses its promised time (percent of price).
insert into public.app_settings(key, value) values ('late_credit_pct', '25') on conflict (key) do nothing;

-- Booking now records the promised delivery time (booking time + quoted ETA).
create or replace function public.book_shipment(p_service public.service_level, p_pickup uuid, p_dropoff uuid, p_weight numeric, p_reference text, p_notes text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_company uuid := public.my_company(); a public.locations; b public.locations; r public.service_rates;
        v_miles numeric; v_price integer; v_id uuid; v_eta integer;
begin
  if public.my_role() <> 'client' or v_company is null then raise exception 'Only client accounts with a company can book shipments'; end if;
  if p_weight is null or p_weight <= 0 or p_weight > 150 then raise exception 'Weight must be between 1 and 150 lb'; end if;
  select * into a from public.locations where id = p_pickup and (is_hub or company_id = v_company);
  select * into b from public.locations where id = p_dropoff and (is_hub or company_id = v_company);
  if a.id is null or b.id is null then raise exception 'Choose valid pickup and delivery locations'; end if;
  if a.id = b.id then raise exception 'Pickup and delivery must be different'; end if;
  select * into r from public.service_rates where service = p_service;
  v_miles := public.road_miles(a.lat, a.lng, b.lat, b.lng);
  v_price := public.quote_cents(p_service, v_miles, p_weight);
  v_eta := round(r.lead_minutes + v_miles * r.minutes_per_mile)::integer;
  insert into public.shipments(company_id, created_by, service, pickup_id, dropoff_id, weight_lb, reference, notes, distance_mi, price_cents, driver_payout_cents, eta_minutes, promised_at)
  values (v_company, auth.uid(), p_service, a.id, b.id, p_weight, left(nullif(trim(p_reference), ''), 200), left(nullif(trim(p_notes), ''), 1000), v_miles, v_price, round(v_price * 0.45)::integer, v_eta, now() + make_interval(mins => v_eta))
  returning id into v_id;
  insert into public.shipment_events(shipment_id, kind, label) values (v_id, 'booked', 'Booked');
  return v_id;
end $$;

-- Delivery now takes a photo and applies the late credit automatically.
drop function public.complete_delivery(uuid, text, text);
create function public.complete_delivery(p_id uuid, p_name text, p_signature text, p_photo text) returns text
language plpgsql security definer set search_path = public as $$
declare s public.shipments; v_number text; v_pct numeric; v_credit integer := 0; v_late boolean;
begin
  if nullif(trim(p_name), '') is null then raise exception 'Recipient name is required'; end if;
  if p_signature is null or p_signature not like 'data:image/png;base64,%' or length(p_signature) > 300000 then raise exception 'A valid signature is required'; end if;
  if p_photo is not null and (p_photo not like 'data:image/jpeg;base64,%' or length(p_photo) > 600000) then raise exception 'The delivery photo is not valid'; end if;
  select coalesce(nullif(value, '')::numeric, 0) into v_pct from public.app_settings where key = 'late_credit_pct';
  update public.shipments set status = 'delivered', delivered_at = now(), pod_name = left(trim(p_name), 120), pod_signature = p_signature, pod_photo = p_photo
   where id = p_id and status = 'picked' and driver_id = auth.uid() returning * into s;
  if s.id is null then raise exception 'Cannot complete delivery for this job'; end if;
  v_late := s.promised_at is not null and s.delivered_at > s.promised_at;
  if v_late then
    v_credit := round(s.price_cents * coalesce(v_pct, 0) / 100)::integer;
    update public.shipments set late_credit_cents = v_credit where id = s.id;
  end if;
  insert into public.shipment_events(shipment_id, kind, label)
  values (p_id, 'delivered', 'Delivered, signed by ' || left(trim(p_name), 120) || case when v_late then ' (late, credit applied)' else '' end);
  insert into public.invoices(shipment_id, company_id, amount_cents) values (s.id, s.company_id, s.price_cents - v_credit) returning number into v_number;
  return v_number;
end $$;

-- Secret tracking link: anyone with the token sees status, driver first name, vehicle and live position.
create function public.track_by_token(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'waybill', s.waybill, 'status', s.status, 'service', s.service,
    'pickup', jsonb_build_object('name', a.name, 'lat', a.lat, 'lng', a.lng),
    'dropoff', jsonb_build_object('name', b.name, 'lat', b.lat, 'lng', b.lng),
    'eta_minutes', s.eta_minutes, 'promised_at', s.promised_at, 'delivered_at', s.delivered_at,
    'late_credit_cents', s.late_credit_cents,
    'driver_first_name', nullif(split_part(coalesce(s.driver_name, ''), ' ', 1), ''),
    'driver_vehicle', p.vehicle,
    'driver_lat', case when s.status in ('assigned','picked') then s.driver_lat end,
    'driver_lng', case when s.status in ('assigned','picked') then s.driver_lng end,
    'driver_pos_at', case when s.status in ('assigned','picked') then s.driver_pos_at end,
    'pod_name', s.pod_name, 'pod_photo', s.pod_photo,
    'events', coalesce((select jsonb_agg(jsonb_build_object('kind', e.kind, 'at', e.created_at) order by e.created_at)
                        from public.shipment_events e where e.shipment_id = s.id), '[]'::jsonb))
  from public.shipments s
  join public.locations a on a.id = s.pickup_id
  join public.locations b on b.id = s.dropoff_id
  left join public.profiles p on p.id = s.driver_id
  where s.track_token = trim(p_token)
$$;

revoke execute on function public.complete_delivery(uuid, text, text, text), public.track_by_token(text), public.book_shipment(public.service_level, uuid, uuid, numeric, text, text) from public, anon;
grant execute on function public.complete_delivery(uuid, text, text, text), public.book_shipment(public.service_level, uuid, uuid, numeric, text, text) to authenticated;
grant execute on function public.track_by_token(text) to anon, authenticated;
