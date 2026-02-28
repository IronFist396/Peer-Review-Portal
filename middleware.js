// middleware.js
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production"
  });
  
  // In Next.js with basePath, pathname INCLUDES the base path (e.g., /portal/home)
  const { pathname } = req.nextUrl;
  
  // Define paths including the basePath
  const basePath = "/portal";
  const publicPath = `${basePath}/home`;
  const dashboardPath = `${basePath}/dashboard`;
  
  // 1. Handle root access to /portal or /portal/
  if (pathname === basePath || pathname === `${basePath}/`) {
    if (token) {
      return NextResponse.redirect(new URL(dashboardPath, req.url));
    } else {
      return NextResponse.redirect(new URL(publicPath, req.url));
    }
  }
  
  // 2. Redirect authenticated users away from Login (/portal/home)
  if (token && pathname === publicPath) {
    return NextResponse.redirect(new URL(dashboardPath, req.url));
  }
  
  // 3. Protect private routes
  const isProtectedPath = 
    pathname.startsWith(dashboardPath) || 
    pathname.startsWith(`${basePath}/candidates`) || 
    pathname.startsWith(`${basePath}/admin`);
  
  if (!token && isProtectedPath) {
    return NextResponse.redirect(new URL(publicPath, req.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logo.*\\.svg).*)",
  ],
};
