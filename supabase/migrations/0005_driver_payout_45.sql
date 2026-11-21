-- Driver pay is 45% of the shipment price (was 62%). Applies to new bookings only;
-- shipments already booked keep the payout stored on the shipment.
create or replace function public.book_shipment(p_service public.service_level, p_pickup uuid, p_dropoff uuid, p_weight numeric, p_reference text, p_notes text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_company uuid := public.my_company(); a public.locations; b public.locations;
        v_miles numeric; v_price integer; v_id uuid;
begin
  if public.my_role() <> 'client' or v_company is null then raise exception 'Only client accounts with a company can book shipments'; end if;
  if p_weight is null or p_weight <= 0 or p_weight > 150 then raise exception 'Weight must be between 1 and 150 lb'; end if;
  select * into a from public.locations where id = p_pickup and (is_hub or company_id = v_company);
  select * into b from public.locations where id = p_dropoff and (is_hub or company_id = v_company);
  if a.id is null or b.id is null then raise exception 'Choose valid pickup and delivery locations'; end if;
  if a.id = b.id then raise exception 'Pickup and delivery must be different'; end if;
  v_miles := public.road_miles(a.lat, a.lng, b.lat, b.lng);
  v_price := public.quote_cents(p_service, v_miles, p_weight);
  insert into public.shipments(company_id, created_by, service, pickup_id, dropoff_id, weight_lb, reference, notes, distance_mi, price_cents, driver_payout_cents)
  values (v_company, auth.uid(), p_service, a.id, b.id, p_weight, left(nullif(trim(p_reference), ''), 200), left(nullif(trim(p_notes), ''), 1000), v_miles, v_price, round(v_price * 0.45)::integer)
  returning id into v_id;
  insert into public.shipment_events(shipment_id, kind, label) values (v_id, 'booked', 'Booked');
  return v_id;
end $$;
