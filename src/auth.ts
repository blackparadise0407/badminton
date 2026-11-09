import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    signIn({ profile }) {
      return (
        profile?.email === process.env.ADMIN_EMAIL &&
        profile?.email_verified === true
      );
    },
  },
});
