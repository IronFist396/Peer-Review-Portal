// lib/auth.js
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
const { logger } = require("@/lib/logger");

export const authOptions = {
  // 1. Trust Nginx
  trustHost: true,

  // 2. FORCE correct cookie settings (Fixes the loop!)
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`, // Force Secure name
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/portal', // MUST match your basePath
        secure: true,    // Force Secure (HTTPS)
      },
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/portal',
        secure: true,
      },
    },
  },
  session: {
    strategy: "jwt",
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          logger.warn('AUTH', 'Failed login attempt - user not found', { email: credentials.email });
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          logger.warn('AUTH', 'Failed login attempt - invalid password', { email: credentials.email });
          return null;
        }

        logger.userAction('LOGIN', user.id, user.email, { 
          name: user.name,
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
