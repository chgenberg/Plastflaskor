import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-post", type: "email" },
        password: { label: "Lösenord", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          resellerId: user.resellerId,
          factoryId: user.factoryId,
          customerId: user.customerId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const email = String(user?.email ?? token.email ?? "")
        .toLowerCase()
        .trim();
      if (!email) return token;
      const fresh = await prisma.user.findUnique({ where: { email } });
      if (!fresh || !fresh.isActive) return token;
      token.sub = fresh.id;
      token.email = fresh.email;
      token.name = fresh.name;
      token.role = fresh.role;
      token.resellerId = fresh.resellerId;
      token.factoryId = fresh.factoryId;
      token.customerId = fresh.customerId;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as string) ?? "PUBLIC";
        session.user.resellerId = (token.resellerId as string | null) ?? null;
        session.user.factoryId = (token.factoryId as string | null) ?? null;
        session.user.customerId = (token.customerId as string | null) ?? null;
      }
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
      resellerId?: string | null;
      factoryId?: string | null;
      customerId?: string | null;
    };
  }
}
