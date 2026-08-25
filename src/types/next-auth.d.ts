import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    resellerId?: string | null;
    factoryId?: string | null;
  }
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      resellerId?: string | null;
      factoryId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    resellerId?: string | null;
    factoryId?: string | null;
  }
}
