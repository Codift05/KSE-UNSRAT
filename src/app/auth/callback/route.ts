import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/backend/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/", url.origin));
  }

  return NextResponse.redirect(new URL("/login?error=Tautan%20tidak%20valid%20atau%20kedaluwarsa", url.origin));
}
