import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Proxy hanya memvalidasi dan menyegarkan sesi; tidak ada alasan memberinya
    // kunci yang melewati seluruh kebijakan keamanan basis data.
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const pathname = request.nextUrl.pathname;
  // Dokumen legal harus terbuka tanpa sesi: pengguna perlu membacanya sebelum
  // masuk, dan Google mengambilnya saat verifikasi OAuth consent screen.
  const publicRoute = pathname === "/login" || pathname === "/forgot-password"
    || pathname === "/privacy" || pathname === "/terms"
    || pathname.startsWith("/auth/") || pathname.startsWith("/api/health/");

  if (!data?.claims && !publicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (data?.claims && (pathname === "/login" || pathname === "/forgot-password")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
