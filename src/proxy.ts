import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/workflows(.*)",
  "/runs(.*)",
  "/connectors(.*)",
  "/settings(.*)",
  "/audit-log(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const isClerkConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  );

  if (isClerkConfigured && isProtectedRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
