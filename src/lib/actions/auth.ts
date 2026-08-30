"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { checkBotId } from "botid/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

async function siteOrigin() {
  const host = (await headers()).get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

export interface AuthActionState {
  error?: string;
  info?: string;
}

export async function signInAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Incorrect email or password. Please try again." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  const destination = next || (profile?.role === "admin" ? "/admin/dashboard" : profile?.role === "production" ? "/production" : "/dashboard");
  redirect(destination);
}

export async function signUpAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const verification = await checkBotId();
  if (verification.isBot) return { error: "We couldn't create your account. Please try again." };

  const admin = createAdminClient();
  const ip = await clientIp();
  const withinIpLimit = await checkRateLimit(admin, `signup:ip:${ip}`, { limit: 8, windowMs: 60 * 60 * 1000 });
  if (!withinIpLimit) return { error: "Too many sign-up attempts from this connection. Please try again in a bit." };

  const fullName = String(formData.get("full_name") || "").trim();
  const businessName = String(formData.get("business_name") || "").trim();
  const whatsapp = String(formData.get("whatsapp_number") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!fullName || !email || !password || !whatsapp) return { error: "Please fill in all required fields." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: "customer", whatsapp_number: whatsapp },
      emailRedirectTo: `${await siteOrigin()}/auth/confirm`,
    },
  });

  if (error) return { error: error.message.includes("already registered") ? "An account with this email already exists." : "We couldn't create your account. Please try again." };
  if (!data.user) return { error: "We couldn't create your account. Please try again." };

  // Link (or create) the canonical customer record for this user.
  const { data: existingCustomer } = await admin
    .from("customers")
    .select("id")
    .is("user_id", null)
    .eq("email", email)
    .maybeSingle();

  if (existingCustomer) {
    await admin.from("customers").update({ user_id: data.user.id, business_name: businessName || undefined }).eq("id", existingCustomer.id);
  } else {
    await admin.from("customers").insert({
      user_id: data.user.id,
      full_name: fullName,
      business_name: businessName || null,
      email,
      whatsapp_number: whatsapp,
      source: "website",
    });
  }

  if (!data.session) {
    return { info: "Account created! Please check your email to confirm your address before signing in." };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
