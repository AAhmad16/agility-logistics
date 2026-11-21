-- Quote requests from the website contact form. Only admins can read them.
create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  company text,
  email text,
  phone text,
  message text,
  status text not null default 'new' check (status in ('new','contacted','closed'))
);
create index quote_requests_created_idx on public.quote_requests(created_at desc);
alter table public.quote_requests enable row level security;
create policy quote_requests_admin_read on public.quote_requests for select to authenticated using (public.my_role() = 'admin');
create policy quote_requests_admin_update on public.quote_requests for update to authenticated using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

create function public.submit_quote_request(p_name text, p_company text, p_email text, p_phone text, p_message text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if nullif(trim(p_name), '') is null then raise exception 'Enter your name.'; end if;
  if nullif(trim(p_email), '') is null and nullif(trim(p_phone), '') is null then raise exception 'Enter an email or a phone number so we can reach you.'; end if;
  if p_email is not null and trim(p_email) <> '' and trim(p_email) !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'That email address does not look right.'; end if;
  if (select count(*) from public.quote_requests where created_at > now() - interval '1 hour') >= 60 then raise exception 'Too many requests right now. Please call dispatch.'; end if;
  insert into public.quote_requests(name, company, email, phone, message)
  values (left(trim(p_name), 120), left(nullif(trim(p_company), ''), 160), left(nullif(trim(p_email), ''), 200), left(nullif(trim(p_phone), ''), 40), left(nullif(trim(p_message), ''), 1500));
end $$;
revoke execute on function public.submit_quote_request(text, text, text, text, text) from public;
grant execute on function public.submit_quote_request(text, text, text, text, text) to anon, authenticated;
