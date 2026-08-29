import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Where Supabase redirects the browser back to after verifying a signup
// email (PKCE flow: ?code=...). Exchanging the code confirms the address,
// but we deliberately don't keep the resulting session — signing in from
// an emailed link is easy to trigger accidentally (mail clients and link
// scanners often pre-fetch links), so we sign back out immediately and
// send the user to sign in normally with their password instead.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/sign-in?confirmed=1`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=confirmation_failed`);
}
