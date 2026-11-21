-- DEMO ONLY. Creates three demo logins and sample shipments. Re-runnable (resets the demo data).
-- Replace __DEMO_PASSWORD__ before running. Delete these users before going live.
do $seed$
declare
  pw text := '__DEMO_PASSWORD__';
  v_client uuid; v_d1 uuid; v_d2 uuid; v_admin uuid; v_co uuid; v_s uuid;
begin
  -- helper: create an auth user if the email does not exist yet
  create or replace function pg_temp.mk_user(p_email text, p_name text, p_company text) returns uuid language plpgsql as $f$
  declare uid uuid;
  begin
    select id into uid from auth.users where email = p_email;
    if uid is null then
      uid := gen_random_uuid();
      insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
      values ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',p_email,extensions.crypt(current_setting('seed.pw'),extensions.gen_salt('bf')),now(),
              '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name',p_name,'company_name',p_company),now(),now(),'','','','');
      insert into auth.identities(id,user_id,identity_data,provider,provider_id,last_sign_in_at,created_at,updated_at)
      values (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email',p_email,'email_verified',true),'email',uid::text,now(),now(),now());
    else
      update auth.users set encrypted_password = extensions.crypt(current_setting('seed.pw'),extensions.gen_salt('bf')) where id = uid;
    end if;
    return uid;
  end $f$;

  perform set_config('seed.pw', pw, true);
  v_client := pg_temp.mk_user('client.demo@agility.test','Dana Whitfield','Meridian Aerospace Supply');
  v_d1     := pg_temp.mk_user('driver.demo@agility.test','Marcus T.',null);
  v_d2     := pg_temp.mk_user('driver2.demo@agility.test','Priya S.',null);
  v_admin  := pg_temp.mk_user('admin.demo@agility.test','Dispatch Demo',null);
  update public.profiles set role='driver', vehicle='Van 14 · Schaumburg zone' where id = v_d1;
  update public.profiles set role='driver', vehicle='Van 9 · Naperville zone' where id = v_d2;
  update public.profiles set role='admin' where id = v_admin;
  select company_id into v_co from public.profiles where id = v_client;

  delete from public.invoices where company_id = v_co;
  delete from public.shipments where company_id = v_co;

  create or replace function pg_temp.seed_ship(p_co uuid, p_by uuid, p_service public.service_level, p_from text, p_to text, p_w numeric,
      p_ref text, p_notes text, p_status public.shipment_status, p_drv uuid, p_dname text, p_age int, p_t_assigned int, p_t_picked int, p_t_done int, p_pod text)
  returns uuid language plpgsql as $f$
  declare a public.locations; b public.locations; mi numeric; pr int; v_id uuid; ts timestamptz := now();
          sig text := 'data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%2260%22%3E%3Cpath d=%22M6 42 C20 6 32 56 48 26 S78 8 92 38 S122 34 154 18%22 fill=%22none%22 stroke=%22%230D1B2A%22 stroke-width=%222.6%22 stroke-linecap=%22round%22/%3E%3C/svg%3E';
  begin
    select * into a from public.locations where name = p_from and is_hub;
    select * into b from public.locations where name = p_to and is_hub;
    mi := public.road_miles(a.lat,a.lng,b.lat,b.lng);
    pr := public.quote_cents(p_service, mi, p_w);
    insert into public.shipments(company_id,created_by,service,pickup_id,dropoff_id,weight_lb,reference,notes,distance_mi,price_cents,driver_payout_cents,status,driver_id,driver_name,created_at,
        accepted_at,picked_at,delivered_at,pod_name,pod_signature,driver_lat,driver_lng,driver_pos_at)
    values (p_co,p_by,p_service,a.id,b.id,p_w,p_ref,p_notes,mi,pr,round(pr*0.62),p_status,p_drv,p_dname,ts - make_interval(mins => p_age),
        case when p_t_assigned is not null then ts - make_interval(mins => p_t_assigned) end,
        case when p_t_picked is not null then ts - make_interval(mins => p_t_picked) end,
        case when p_t_done is not null then ts - make_interval(mins => p_t_done) end,
        p_pod, case when p_pod is not null then sig end,
        case when p_status = 'picked' then a.lat + (b.lat - a.lat) * 0.45 end,
        case when p_status = 'picked' then a.lng + (b.lng - a.lng) * 0.45 end,
        case when p_status = 'picked' then ts end)
    returning shipments.id into v_id;
    insert into public.shipment_events(shipment_id,kind,label,created_at) values (v_id,'booked','Booked',ts - make_interval(mins => p_age));
    if p_t_assigned is not null then insert into public.shipment_events(shipment_id,kind,label,created_at) values (v_id,'assigned',p_dname || ' accepted the job',ts - make_interval(mins => p_t_assigned)); end if;
    if p_t_picked is not null then insert into public.shipment_events(shipment_id,kind,label,created_at) values (v_id,'picked','Package picked up',ts - make_interval(mins => p_t_picked)); end if;
    if p_t_done is not null then
      insert into public.shipment_events(shipment_id,kind,label,created_at) values (v_id,'delivered','Delivered, signed by ' || p_pod,ts - make_interval(mins => p_t_done));
      insert into public.invoices(shipment_id,company_id,amount_cents,issued_at,due_at) values (v_id,p_co,pr,ts - make_interval(mins => p_t_done), ts - make_interval(mins => p_t_done) + interval '15 days');
    end if;
    return v_id;
  end $f$;

  -- delivered yesterday (invoice paid), delivered today (invoice open), in transit, and one waiting for a driver
  v_s := pg_temp.seed_ship(v_co,v_client,'sameday','Schaumburg HQ','Midway Cargo (MDW)',12,'PO 88431 · actuator seal kit',null,'delivered',v_d2,'Priya S.',1500,1495,1460,1380,'D. Okafor');
  update public.invoices set status='paid', paid_at = issued_at + interval '2 days' where shipment_id = v_s;
  perform pg_temp.seed_ship(v_co,v_client,'sprint','Elgin','O''Hare Cargo (ORD)',6,'AOG · hydraulic valve P/N 4471-B','Call receiving dock on arrival.','delivered',v_d1,'Marcus T.',190,186,170,125,'R. Alvarez');
  perform pg_temp.seed_ship(v_co,v_client,'nfo','Naperville','O''Hare Cargo (ORD)',31,'Next flight to DFW · avionics rack','Declare at the airline cargo counter.','picked',v_d2,'Priya S.',58,54,22,null,null);
  perform pg_temp.seed_ship(v_co,v_client,'sameday','Gurnee','Chicago Loop',18,'Calibration gauges · lot 5530','Ask for Priority Receiving.','pending',null,null,7,null,null,null,null);
end $seed$;
