"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { homeFor } from "@/lib/session";
import { safeNext } from "@/lib/format";
import type { Role } from "@/lib/types";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const back = (path: string, error: string): never => redirect(`${path}?error=${encodeURIComponent(error)}`);

export async function login(formData: FormData) {
  const supabase = await createClient();
  const next = text(formData, "next");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: text(formData, "email"),
    password: text(formData, "password"),
  });
  if (error || !data.user) return back("/login", "Email or password is incorrect.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single<{ role: Role }>();
  redirect(safeNext(next, homeFor(profile?.role ?? "client")));
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const password = text(formData, "password");
  if (password.length < 8) return back("/signup", "Use a password with at least 8 characters.");
  if (!text(formData, "company_name")) return back("/signup", "Enter your company name.");
  const { data, error } = await supabase.auth.signUp({
    email: text(formData, "email"),
    password,
    options: { data: { full_name: text(formData, "full_name"), company_name: text(formData, "company_name") } },
  });
  if (error) return back("/signup", error.message);
  if (!data.session) redirect("/login?message=" + encodeURIComponent("Check your email to confirm your account, then sign in."));
  redirect("/portal");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function bookShipment(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("book_shipment", {
    p_service: text(formData, "service"),
    p_pickup: text(formData, "pickup"),
    p_dropoff: text(formData, "dropoff"),
    p_weight: Number(text(formData, "weight")),
    p_reference: text(formData, "reference"),
    p_notes: text(formData, "notes"),
  });
  if (error) return back("/portal/new", error.message);
  revalidatePath("/portal");
  redirect(`/portal/s/${data}`);
}

export async function cancelShipment(formData: FormData) {
  const supabase = await createClient();
  const id = text(formData, "id");
  const { error } = await supabase.rpc("cancel_shipment", { p_id: id });
  if (error) return back(`/portal/s/${id}`, error.message);
  revalidatePath("/portal");
  redirect(`/portal/s/${id}`);
}

export async function acceptJob(formData: FormData) {
  const supabase = await createClient();
  const id = text(formData, "id");
  const { error } = await supabase.rpc("accept_shipment", { p_id: id });
  if (error) return back("/driver", error.message);
  revalidatePath("/driver");
  redirect(`/driver/job/${id}`);
}

export async function confirmPickup(formData: FormData) {
  const supabase = await createClient();
  const id = text(formData, "id");
  const { error } = await supabase.rpc("confirm_pickup", { p_id: id });
  if (error) return back(`/driver/job/${id}`, error.message);
  revalidatePath("/driver");
  redirect(`/driver/job/${id}`);
}

export async function completeDelivery(id: string, name: string, signature: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_delivery", { p_id: id, p_name: name, p_signature: signature });
  if (error) return { error: error.message };
  revalidatePath("/driver");
  return { invoice: data as string };
}

export async function sendDriverPosition(id: string, lat: number, lng: number) {
  const supabase = await createClient();
  await supabase.rpc("update_driver_position", { p_id: id, p_lat: lat, p_lng: lng });
}

export async function assignDriver(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_assign", { p_id: text(formData, "id"), p_driver: text(formData, "driver") });
  if (error) return back("/admin", error.message);
  revalidatePath("/admin");
  redirect("/admin");
}
