"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    options: { data: { full_name: fullName, role: "customer", whatsapp_number: whatsapp } },
  });

  if (error) return { error: error.message.includes("already registered") ? "An account with this email already exists." : "We couldn't create your account. Please try again." };
  if (!data.user) return { error: "We couldn't create your account. Please try again." };

  // Link (or create) the canonical customer record for this user.
  const admin = createAdminClient();
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
