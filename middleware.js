// middleware.js
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  // Force secure: true so it looks for __Secure-next-auth.session-token
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: true 
  });
  
  // Note: req.nextUrl.pathname does NOT include the basePath (/portal)
  // so these checks are correct for /portal/home and /portal/dashboard
  const isLoginPage = req.nextUrl.pathname === "/" || req.nextUrl.pathname === "/home";
  const isDashboard = req.nextUrl.pathname === "/dashboard";
  
  if (!token && isDashboard) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
