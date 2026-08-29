import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Where Supabase redirects the browser back to after verifying a
// signup/magic-link/recovery email (PKCE flow: ?code=...). Exchanges the
// code for a real session, then sends the user to the right dashboard.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      const destination = profile?.role === "admin" ? "/admin/dashboard" : profile?.role === "production" ? "/production" : "/dashboard";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=confirmation_failed`);
}
