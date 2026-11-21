import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile, Role } from "./types";

export const homeFor = (role: Role) => (role === "driver" ? "/driver" : role === "admin" ? "/admin" : "/portal");

export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, company_id, phone, vehicle")
    .eq("id", user.id)
    .single<Profile>();
  return profile ? { user, profile } : null;
});

export async function requireRole(role: Role) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.profile.role !== role) redirect(homeFor(session.profile.role));
  return session;
}
