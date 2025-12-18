import createMiddleware from "next-intl/middleware";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n/config-constants";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  "/account(.*)",
  "/admin(.*)",
  "/:locale/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;

  // Skip processing for static files (files with extensions)
  // This must be checked before calling auth() to avoid errors
  if (path.includes('.') || path.startsWith('/_next') || path.startsWith('/_vercel')) {
    return NextResponse.next();
  }

  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch (error) {
    // If auth fails, continue without userId (for public routes)
    console.error('Auth error in middleware:', error);
  }

  // Skip locale prefixing for account routes; still enforce auth
  if (path.startsWith("/account")) {
    if (!userId) {
      return NextResponse.redirect(new URL(`/${defaultLocale}/auth/sign-in`, req.url));
    }
    return NextResponse.next();
  }

  // API routes: allow Clerk auth to run for /api/user* so auth() works there; otherwise skip
  if (path.startsWith("/api")) {
    if (path.startsWith("/api/user")) {
      // Let Clerk run; downstream handlers will read auth()
      return NextResponse.next();
    }
    return NextResponse.next();
  }

  // Check if this is an admin route (with or without locale prefix)
  const pathSegments = path.split("/").filter(Boolean);
  const firstSegment = pathSegments[0];
  const secondSegment = pathSegments[1];
  const isAdminRoute = secondSegment === "admin" || (firstSegment === "admin" && !locales.includes(firstSegment as any));
  
  if (isAdminRoute) {
    // Check authentication for admin routes
    if (!userId) {
      return NextResponse.redirect(new URL(`/${defaultLocale}/auth/sign-in`, req.url));
    }
    
    // Get user from Clerk to check role
    // Note: Role checking will be done in the page components since we need to fetch user metadata
    // For now, just check authentication
    
    // If path doesn't have locale prefix, redirect to locale-prefixed version
    if (firstSegment === "admin") {
      return NextResponse.redirect(new URL(`/${defaultLocale}${path}`, req.url));
    }
  } else {
    // If user is authenticated and trying to access non-admin customer pages
    // This logic can be refined based on role checking in components
    // For now, let authenticated users access customer pages
  }

  // For protected routes, check authentication
  if (isProtectedRoute(req)) {
    if (!userId) {
      const locale = pathSegments[0] && locales.includes(pathSegments[0] as any)
        ? pathSegments[0]
        : defaultLocale;
      const signInUrl = new URL(`/${locale}/auth/sign-in`, req.url);
      signInUrl.searchParams.set("redirect_url", req.nextUrl.href);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Let intl middleware handle locale routing for all routes (including admin)
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    "/((?!_next|_vercel|.*\\..*).*)",
    // Explicitly include auth-protected API routes that need Clerk
    "/api/user/:path*",
  ],
};
