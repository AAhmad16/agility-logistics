import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const to = (path: string) => NextResponse.redirect(new URL(path, site()), 303);

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const invoiceId = String(form.get("invoice_id") ?? "");

  // Row level security guarantees users can only load their own company's invoices.
  const supabase = await createClient();
  const { data: invoice } = await supabase.from("invoices").select("id, number, amount_cents, status").eq("id", invoiceId).maybeSingle();
  if (!invoice) return to("/portal/invoices?error=" + encodeURIComponent("Invoice not found."));
  if (invoice.status !== "open") return to("/portal/invoices");

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Demo mode: no money moves. Controlled by public.app_settings.demo_payments in the database.
    const { error } = await supabase.rpc("pay_invoice_demo", { p_id: invoice.id });
    if (error) return to("/portal/invoices?error=" + encodeURIComponent(error.message));
    return to("/portal/invoices?paid=1");
  }

  const stripe = new Stripe(key);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: invoice.amount_cents, product_data: { name: `Invoice ${invoice.number}` } } }],
    metadata: { invoice_id: invoice.id },
    success_url: `${site()}/portal/invoices?paid=1`,
    cancel_url: `${site()}/portal/invoices`,
  });
  await createAdminClient().from("invoices").update({ stripe_session_id: session.id }).eq("id", invoice.id);
  return NextResponse.redirect(session.url!, 303);
}
