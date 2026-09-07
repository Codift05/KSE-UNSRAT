import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });

  return NextResponse.json(
    error ? { connected: false, error: error.message } : { connected: true },
    { status: error ? 503 : 200 },
  );
}
