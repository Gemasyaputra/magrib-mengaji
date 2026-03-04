import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users, mosques } from "@/lib/schema";
import { eq } from "drizzle-orm";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // For CredentialsProvider, we return 'true' if authorize succeeds.
      // We only do custom Google validation here since authorize() handles credentials fully.
      if (account?.provider === "google") {
        if (!user.email) return false;

        try {
          // Check if user exists in the database
          const existingUser = await db
            .select({
              id: users.id,
              isVerified: users.isVerified,
              mosqueId: users.mosqueId
            })
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          if (existingUser.length > 0) {
            const dbUser = existingUser[0];
            
            // Check if email is verified
            if (!dbUser.isVerified) {
              return "/?error=UnverifiedEmail";
            }
            
            // For admins/teachers/parents, check if mosque is approved by Super Admin
            if (dbUser.mosqueId) {
               const mosqueCheck = await db.select({ isApproved: mosques.isApproved }).from(mosques).where(eq(mosques.id, dbUser.mosqueId)).limit(1);
               if (mosqueCheck.length > 0 && !mosqueCheck[0].isApproved) {
                  return "/?error=MosqueNotApproved";
               }
            }
            
            // User exists, verified, and mosque approved
            return true;
          } else {
            // User does not exist in DB, deny login
            return "/?error=UserNotFound";
          }
        } catch (error) {
          console.error("Error checking user in database:", error);
          return false;
        }
      }
      return true; // Used by Credentials
    },
    async jwt({ token, user, account }) {
      // When user signs in, attach extra info from DB to token
      if (user && user.email) {
         try {
            const dbUser = await db
              .select({
                id: users.id,
                name: users.name, // Fetch name from our DB
                role: users.role,
                mosqueId: users.mosqueId,
                mosqueName: mosques.name
              })
              .from(users)
              .leftJoin(mosques, eq(users.mosqueId, mosques.id))
              .where(eq(users.email, user.email))
              .limit(1);
            
            if (dbUser.length > 0) {
               token.id = dbUser[0].id.toString();
               token.name = dbUser[0].name; // Override Google name with DB name
               token.role = dbUser[0].role;
               token.mosqueId = dbUser[0].mosqueId?.toString();
               token.mosqueName = dbUser[0].mosqueName;
            }
         } catch (e) {
            console.error(e);
         }
      }
      return token;
    },
    async session({ session, token }) {
      // Attach info from token to session
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).name = token.name; // Apply DB name to session
        (session.user as any).role = token.role;
        (session.user as any).mosqueId = token.mosqueId;
        (session.user as any).mosqueName = token.mosqueName;
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // Default sign in page if things go wrong
    error: "/",  // Redirect back to home for unauthorized emails
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
