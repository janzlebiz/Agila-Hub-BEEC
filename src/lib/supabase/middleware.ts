import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Fetch authenticated user (more secure than getSession() in SSR)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Protect internal routes: /admin, /officer, /member
  const isAuthRoute = pathname.startsWith("/auth");
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/officer") ||
    pathname.startsWith("/member") ||
    pathname.startsWith("/settings");

  // Redirect unauthenticated user trying to access protected routes
  if (!user && isProtectedRoute) {
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If authenticated user visits login or register, redirect to home
  if (user && isAuthRoute && !pathname.startsWith("/auth/callback")) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
