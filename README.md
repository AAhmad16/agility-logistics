# Agility Logistics

Time-critical delivery platform for Agility Logistics: public website, client portal, driver app (installable on iPhone) and a dispatch board.

**Stack:** Next.js 16 (App Router) on Vercel · Supabase (Postgres, Auth, Realtime, row level security) · Stripe Checkout for invoices.

## What is in here

| Area | Path | Who |
|---|---|---|
| Website, price quote, package tracking | `/` | anyone |
| Client portal: book, follow live, invoices, pay | `/portal` | clients |
| Driver app: open jobs, accept, pickup, signature, earnings | `/driver` | drivers |
| Dispatch board: all shipments, assign drivers | `/admin` | admins |

Clients sign up themselves (`/signup`). Drivers and admins are created by promoting a user:

```sql
update public.profiles set role = 'driver', vehicle = 'Van 3' where id = '<user id>';
```

## How the data is protected

- Every table has row level security. Clients see only their company's rows, drivers see open jobs and their own, admins see everything.
- Shipments are never written directly. Booking, accepting, pickup, delivery and cancelling go through database functions (`supabase/migrations/0001_schema.sql`) that check the caller's role, enforce the status order, compute the price on the server and create the invoice on delivery.
- Prices come from `service_rates` and the distance between two locations. The browser cannot set a price.
- Realtime updates respect the same rules, so a client only hears about their own shipments.

## Run locally

```bash
npm install
cp .env.example .env.local     # already points at the agility-logistics Supabase project
npm run dev
```

Demo logins (password is shared separately): `client.demo@`, `driver.demo@`, `driver2.demo@`, `admin.demo@` `agility.test`.
`supabase/seed_demo.sql` recreates them and the sample shipments (replace `__DEMO_PASSWORD__` first).

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel: **Add New > Project**, import the repository (framework: Next.js, no build settings to change).
3. Add the environment variables from `.env.example`. Set `NEXT_PUBLIC_SITE_URL` to the production URL. Add `SUPABASE_SERVICE_ROLE_KEY` (Supabase > Project settings > API) only when you turn on Stripe.
4. In Supabase > Authentication > URL configuration, set **Site URL** to the production URL.
5. For a demo with no email step: Authentication > Providers > Email > turn off **Confirm email**. Turn it back on before launch.

## Install the driver app on an iPhone

Open the site in Safari, go to `/driver`, tap Share, then **Add to Home Screen**. It opens full screen with the Agility icon. A native App Store app (React Native / Expo) can reuse the same Supabase backend later.

## Payments

- **Demo mode (current):** with no Stripe key, "Pay now" marks the invoice paid and charges nothing. It is controlled by one database setting.
- **Live payments:** add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` plus the service role key, and point a Stripe webhook at `/api/stripe/webhook` (event `checkout.session.completed`).

## Before real customers

- [ ] `update public.app_settings set value = 'off' where key = 'demo_payments';`
- [ ] Delete the demo users (`*.demo@agility.test`) and sample shipments
- [ ] Turn on **Confirm email** and leaked-password protection in Supabase Auth
- [ ] Add address search and geocoding (Mapbox or Google) so clients can save their own pickup and delivery addresses. Today the eight Chicago-area hubs in `locations` are used.
- [ ] Replace the schematic map with a real map (`src/components/RouteMap.tsx` is the only file to change)
- [ ] Add a custom domain, email sending (Resend or Supabase SMTP), and error monitoring
- [ ] Review pricing in `service_rates` and the 45% driver payout in `book_shipment`

## Layout

```
supabase/migrations/   schema, functions, policies, rates and hubs
src/proxy.ts           session refresh and signed-out redirects
src/app/actions.ts     server actions (sign in, book, accept, deliver, assign)
src/app/portal|driver|admin   the three signed-in areas
src/components/        route map, live updates, signature pad, quote fields
```
