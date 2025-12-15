//middleware.js
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";

const isSignIn = createRouteMatcher(["/signin", "/reset-password"]);
const isProtected = createRouteMatcher(["/dashboard(.*)", "/account(.*)"]);
const isAdminArea = createRouteMatcher(["/admin(.*)"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const hostname = request.nextUrl.hostname;
  if (hostname === "noviachat.com") {
    const url = request.nextUrl.clone();
    url.hostname = "www.noviachat.com";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  // Redirect authenticated users away from auth pages
  if (isSignIn(request) && (await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/");
  }

  // Redirect unauthenticated users to sign in page
  if (isProtected(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/signin");
  }

  // Redirect unauthenticated users away from admin area
  if (isAdminArea(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/signin");
  }
});

// Run on all routes except static files
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
