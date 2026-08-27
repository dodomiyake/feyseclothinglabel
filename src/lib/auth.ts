import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return profile as Profile | null;
}

export async function requireProfile(...allowedRoles: Array<"customer" | "admin" | "production">) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (allowedRoles.length && !allowedRoles.includes(profile.role)) redirect("/");
  return profile;
}
