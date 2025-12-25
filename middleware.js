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

const redirectMap = new Map([
  ["/blog/novia-ia-personalidades-encuentra-match-perfecto", "/guias/etiquetas-personalidades-novia-virtual"],
  [
    "/blog/personalizando-tu-novia-virtual-herramientas-para-crear-la-companera-ia-perfecta",
    "/guias/personalizar-novia-virtual",
  ],
  [
    "/blog/la-etica-de-las-novias-virtuales-un-debate-necesario-en-la-era-de-la-ia",
    "/guias/seguridad-privacidad-chats-ia",
  ],
  ["/privacidad", "/privacy"],
  ["/contacto", "/support"],
  ["/login", "/signin"],
  ["/user", "/signin"],
  ["/dm", "/chat"],
]);

const gonePaths = new Set([
  "/CGj52Y66J4icn6qOqGJY",
  "/5ffdfe39-aaae-4c9c-9a63-eb963285bdf1",
  "/3c3b446b-57b4-4bf7-a574-8d3630ef4fd2",
]);

function normalizePath(pathname) {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const hostname = request.nextUrl.hostname;
  if (hostname === "noviachat.com") {
    const url = request.nextUrl.clone();
    url.hostname = "www.noviachat.com";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  const path = normalizePath(request.nextUrl.pathname);
  const redirectTarget = redirectMap.get(path);
  if (redirectTarget) {
    const url = request.nextUrl.clone();
    url.pathname = redirectTarget;
    url.search = "";
    return NextResponse.redirect(url, 301);
  }

  if (gonePaths.has(path)) {
    return new NextResponse(null, { status: 410 });
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
