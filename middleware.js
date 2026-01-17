// middleware.js
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  const isLoginPage = req.nextUrl.pathname === "/" || req.nextUrl.pathname === "/home";
  const isDashboard = req.nextUrl.pathname === "/dashboard";
  
  // 1. If user is NOT logged in and tries to access dashboard
  if (!token && isDashboard) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // 2. If user IS logged in and tries to access the login page
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};