import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/magic-link",
];

const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/settings",
  "/meals",
  "/goals",
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  const isApiRoute = pathname.startsWith("/api");
  
  if (isApiRoute && !pathname.startsWith("/api/auth")) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const session = await auth.api.getSession({
        headers: request.headers,
      });
      
      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }
  }
  
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }
  
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session && isProtectedRoute) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    if (session && isAuthRoute) {
      const from = request.nextUrl.searchParams.get("from");
      return NextResponse.redirect(
        new URL(from || "/dashboard", request.url)
      );
    }
    
    if (session && isProtectedRoute) {
      const response = NextResponse.next();
      const sessionData = session as { user?: { id?: string } };
      response.headers.set("x-user-id", sessionData.user?.id || "");
      response.headers.set("x-user-role", "user");
      return response;
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};