-- Demo payments: lets a client mark their own open invoice paid WITHOUT charging anything.
-- Turn off before launch:  update public.app_settings set value = 'off' where key = 'demo_payments';
create table public.app_settings (key text primary key, value text not null);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
insert into public.app_settings values ('demo_payments', 'on');

create function public.pay_invoice_demo(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  if coalesce((select value from public.app_settings where key = 'demo_payments'), 'off') <> 'on' then
    raise exception 'Online payments are not set up yet';
  end if;
  update public.invoices set status = 'paid', paid_at = now()
   where id = p_id and status = 'open' and company_id = public.my_company();
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Invoice not found'; end if;
end $$;
revoke execute on function public.pay_invoice_demo(uuid) from public, anon;
grant execute on function public.pay_invoice_demo(uuid) to authenticated;
