import { withAuth } from "next-auth/middleware";
import { withBasePath } from "./lib/basePath";

export const proxy = withAuth({
  pages: {
    signIn: withBasePath("/auth/signin"),
  },
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|auth/signin|auth/register).*)"],
};
