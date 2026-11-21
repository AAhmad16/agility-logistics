-- Agility Logistics: core schema, row level security, and job-flow functions.

create type public.app_role as enum ('client','driver','admin');
create type public.service_level as enum ('sprint','sameday','nfo','stat');
create type public.shipment_status as enum ('pending','assigned','picked','delivered','cancelled');
create type public.invoice_status as enum ('open','paid','void');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  billing_email text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'client',
  company_id uuid references public.companies(id) on delete set null,
  phone text,
  vehicle text,
  created_at timestamptz not null default now()
);

create table public.service_rates (
  service public.service_level primary key,
  name text not null,
  description text not null,
  window_text text not null,
  base_cents integer not null,
  per_mile_cents integer not null,
  lead_minutes integer not null,
  minutes_per_mile numeric not null
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  is_hub boolean not null default false,
  created_at timestamptz not null default now(),
  check ((is_hub and company_id is null) or (not is_hub and company_id is not null))
);

create sequence public.waybill_seq start 1001;
create sequence public.invoice_seq start 1001;

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  waybill text not null unique default ('AT-' || nextval('public.waybill_seq')::text),
  company_id uuid not null references public.companies(id),
  created_by uuid references auth.users(id),
  service public.service_level not null,
  pickup_id uuid not null references public.locations(id),
  dropoff_id uuid not null references public.locations(id),
  weight_lb numeric(6,1) not null check (weight_lb > 0 and weight_lb <= 150),
  reference text,
  notes text,
  distance_mi numeric(7,1) not null,
  price_cents integer not null check (price_cents >= 0),
  driver_payout_cents integer not null check (driver_payout_cents >= 0),
  status public.shipment_status not null default 'pending',
  driver_id uuid references public.profiles(id),
  driver_name text,
  driver_lat double precision,
  driver_lng double precision,
  driver_pos_at timestamptz,
  pod_name text,
  pod_signature text,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  picked_at timestamptz,
  delivered_at timestamptz,
  check (pickup_id <> dropoff_id)
);
create index shipments_company_idx on public.shipments(company_id, created_at desc);
create index shipments_status_idx on public.shipments(status);
create index shipments_driver_idx on public.shipments(driver_id);

create table public.shipment_events (
  id bigint generated always as identity primary key,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  kind text not null,
  label text not null,
  created_at timestamptz not null default now()
);
create index shipment_events_ship_idx on public.shipment_events(shipment_id, created_at);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('INV-' || to_char(now(),'YYYY') || '-' || nextval('public.invoice_seq')::text),
  shipment_id uuid not null unique references public.shipments(id),
  company_id uuid not null references public.companies(id),
  amount_cents integer not null,
  status public.invoice_status not null default 'open',
  issued_at timestamptz not null default now(),
  due_at timestamptz not null default (now() + interval '15 days'),
  paid_at timestamptz,
  stripe_session_id text
);
create index invoices_company_idx on public.invoices(company_id, issued_at desc);

-- helpers (security definer so policies never recurse into profiles)
create function public.my_role() returns public.app_role
language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;

create function public.my_company() returns uuid
language sql stable security definer set search_path = public as
$$ select company_id from public.profiles where id = auth.uid() $$;

create function public.road_miles(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns numeric language sql immutable set search_path = public as
$$ select greatest(3, round((3958.8 * 2 * asin(sqrt(
     power(sin(radians(lat2 - lat1) / 2), 2) +
     cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
   )) * 1.25)::numeric, 1)) $$;

create function public.quote_cents(p_service public.service_level, p_miles numeric, p_weight numeric)
returns integer language sql stable set search_path = public as
$$ select round(r.base_cents + r.per_mile_cents * p_miles + greatest(0, p_weight - 25) * 60)::integer
   from public.service_rates r where r.service = p_service $$;

-- price + ETA for the marketing quote widget and the booking form
create function public.quote_shipment(p_service public.service_level, p_pickup uuid, p_dropoff uuid, p_weight numeric)
returns table (miles numeric, price_cents integer, eta_minutes integer)
language plpgsql stable security definer set search_path = public as $$
declare a public.locations; b public.locations; r public.service_rates; v_company uuid := public.my_company();
begin
  select * into a from public.locations where id = p_pickup and (is_hub or company_id = v_company);
  select * into b from public.locations where id = p_dropoff and (is_hub or company_id = v_company);
  if a.id is null or b.id is null or a.id = b.id then return; end if;
  select * into r from public.service_rates where service = p_service;
  miles := public.road_miles(a.lat, a.lng, b.lat, b.lng);
  price_cents := public.quote_cents(p_service, miles, coalesce(p_weight, 1));
  eta_minutes := round(r.lead_minutes + miles * r.minutes_per_mile)::integer;
  return next;
end $$;

-- new users become clients with their own company
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_company uuid; v_name text := nullif(trim(new.raw_user_meta_data->>'company_name'), '');
begin
  if v_name is not null then
    insert into public.companies(name, billing_email) values (v_name, new.email) returning id into v_company;
  end if;
  insert into public.profiles(id, full_name, role, company_id)
  values (new.id, nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'client', v_company);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== job-flow functions (the only way shipment state changes) =====
create function public.book_shipment(p_service public.service_level, p_pickup uuid, p_dropoff uuid, p_weight numeric, p_reference text, p_notes text)
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
  values (v_company, auth.uid(), p_service, a.id, b.id, p_weight, left(nullif(trim(p_reference), ''), 200), left(nullif(trim(p_notes), ''), 1000), v_miles, v_price, round(v_price * 0.62)::integer)
  returning id into v_id;
  insert into public.shipment_events(shipment_id, kind, label) values (v_id, 'booked', 'Booked');
  return v_id;
end $$;

create function public.accept_shipment(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_name text; v_n integer;
begin
  if public.my_role() <> 'driver' then raise exception 'Only drivers can accept jobs'; end if;
  select coalesce(full_name, 'Driver') into v_name from public.profiles where id = auth.uid();
  update public.shipments set status = 'assigned', driver_id = auth.uid(), driver_name = v_name, accepted_at = now()
   where id = p_id and status = 'pending';
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'This job is no longer available'; end if;
  insert into public.shipment_events(shipment_id, kind, label) values (p_id, 'assigned', v_name || ' accepted the job');
end $$;

create function public.confirm_pickup(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  update public.shipments set status = 'picked', picked_at = now()
   where id = p_id and status = 'assigned' and driver_id = auth.uid();
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Cannot confirm pickup for this job'; end if;
  insert into public.shipment_events(shipment_id, kind, label) values (p_id, 'picked', 'Package picked up');
end $$;

create function public.complete_delivery(p_id uuid, p_name text, p_signature text) returns text
language plpgsql security definer set search_path = public as $$
declare s public.shipments; v_number text;
begin
  if nullif(trim(p_name), '') is null then raise exception 'Recipient name is required'; end if;
  if p_signature is null or p_signature not like 'data:image/png;base64,%' or length(p_signature) > 300000 then raise exception 'A valid signature is required'; end if;
  update public.shipments set status = 'delivered', delivered_at = now(), pod_name = left(trim(p_name), 120), pod_signature = p_signature
   where id = p_id and status = 'picked' and driver_id = auth.uid() returning * into s;
  if s.id is null then raise exception 'Cannot complete delivery for this job'; end if;
  insert into public.shipment_events(shipment_id, kind, label) values (p_id, 'delivered', 'Delivered, signed by ' || left(trim(p_name), 120));
  insert into public.invoices(shipment_id, company_id, amount_cents) values (s.id, s.company_id, s.price_cents) returning number into v_number;
  return v_number;
end $$;

create function public.update_driver_position(p_id uuid, p_lat double precision, p_lng double precision) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.shipments set driver_lat = p_lat, driver_lng = p_lng, driver_pos_at = now()
   where id = p_id and driver_id = auth.uid() and status in ('assigned','picked');
end $$;

create function public.cancel_shipment(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  update public.shipments set status = 'cancelled'
   where id = p_id and status = 'pending' and (company_id = public.my_company() or public.my_role() = 'admin');
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Only unassigned shipments can be cancelled'; end if;
  insert into public.shipment_events(shipment_id, kind, label) values (p_id, 'cancelled', 'Cancelled');
end $$;

create function public.admin_assign(p_id uuid, p_driver uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_name text; v_n integer;
begin
  if public.my_role() <> 'admin' then raise exception 'Admins only'; end if;
  select coalesce(full_name, 'Driver') into v_name from public.profiles where id = p_driver and role = 'driver';
  if v_name is null then raise exception 'Choose a valid driver'; end if;
  update public.shipments set status = 'assigned', driver_id = p_driver, driver_name = v_name, accepted_at = now()
   where id = p_id and status = 'pending';
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Shipment is not waiting for a driver'; end if;
  insert into public.shipment_events(shipment_id, kind, label) values (p_id, 'assigned', v_name || ' assigned by dispatch');
end $$;

-- ===== function privileges =====
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.quote_shipment(public.service_level, uuid, uuid, numeric) to anon, authenticated;
grant execute on function public.my_role(), public.my_company(),
  public.book_shipment(public.service_level, uuid, uuid, numeric, text, text),
  public.accept_shipment(uuid), public.confirm_pickup(uuid), public.complete_delivery(uuid, text, text),
  public.update_driver_position(uuid, double precision, double precision), public.cancel_shipment(uuid),
  public.admin_assign(uuid, uuid) to authenticated;
grant execute on function public.road_miles(double precision, double precision, double precision, double precision),
  public.quote_cents(public.service_level, numeric, numeric) to anon, authenticated;

-- ===== row level security =====
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.service_rates enable row level security;
alter table public.locations enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_events enable row level security;
alter table public.invoices enable row level security;

create policy companies_read on public.companies for select to authenticated
  using (id = public.my_company() or public.my_role() = 'admin');

create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.my_role() = 'admin');
revoke update on public.profiles from authenticated;
grant update (full_name, phone, vehicle) on public.profiles to authenticated;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy rates_read on public.service_rates for select to anon, authenticated using (true);

create policy locations_hubs on public.locations for select to anon, authenticated using (is_hub);
create policy locations_company on public.locations for select to authenticated
  using (company_id = public.my_company() or public.my_role() = 'admin');
create policy locations_insert on public.locations for insert to authenticated
  with check (not is_hub and company_id = public.my_company() and public.my_role() = 'client');
create policy locations_delete on public.locations for delete to authenticated
  using (not is_hub and company_id = public.my_company() and public.my_role() = 'client');

create policy shipments_read on public.shipments for select to authenticated using (
  company_id = public.my_company()
  or public.my_role() = 'admin'
  or (public.my_role() = 'driver' and (status = 'pending' or driver_id = auth.uid()))
);
create policy events_read on public.shipment_events for select to authenticated
  using (exists (select 1 from public.shipments s where s.id = shipment_id));
create policy invoices_read on public.invoices for select to authenticated
  using (company_id = public.my_company() or public.my_role() = 'admin');

-- clients and drivers write only through the functions above
revoke insert, update, delete on public.shipments, public.shipment_events, public.invoices,
  public.companies, public.service_rates from anon, authenticated;
revoke all on all tables in schema public from anon;
grant select on public.service_rates, public.locations to anon;

alter publication supabase_realtime add table public.shipments, public.shipment_events;
