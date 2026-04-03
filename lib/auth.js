// lib/auth.js
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const authOptions = {
  // 1. Trust Nginx
  debug: false,
  basePath: '/portal/api/auth',  // tells NextAuth its full path
  trustHost: true,

  // 2. FORCE correct cookie settings (Fixes the loop!)
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`, // Force Secure name
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/', // Must be '/' so the cookie can be cleared on logout
        secure: true,    // Force Secure (HTTPS)
      },
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: true,
      },
    },
  },
  session: {
    strategy: "jwt",
  },
  events: {
    async signOut({ token }) {
      if (token) {
        // Lazy-require logger
        const { logger } = require("@/lib/logger");
        
        logger.userAction('LOGOUT', token.id || token.sub, token.email, { 
          name: token.name,
          message: `User ${token.name || token.email} logged out`,
          timestamp: new Date().toISOString()
        });
      }
    },
  },
  pages: {
    signIn: "/home", // Custom login page
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();

        // Lazy-require logger: keeps it out of SSR page bundles (avoids fs/path errors)
        const { logger } = require("@/lib/logger");

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user) {
          logger.warn('AUTH', 'Failed login attempt - user not found', { email: normalizedEmail });
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          logger.warn('AUTH', 'Failed login attempt - invalid password', { email: normalizedEmail });
          return null;
        }

        logger.userAction('LOGIN', user.id, user.email, { 
          name: user.name,
          message: `User ${user.name} logged in`,
          timestamp: new Date().toISOString()
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
        },
      };
    },
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
        };
      }
      return token;
    },
  },
};
