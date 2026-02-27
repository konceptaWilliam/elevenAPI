import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { neon } from "@neondatabase/serverless";

const handler = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials) {
        const sql = neon(`${process.env.DATABASE_URL}`);
        const response = await sql`
        SELECT * FROM users WHERE username = ${credentials?.username}
        `;
        const user = response[0];
        if (!user) {
          console.log("No user found with that username");
          return null;
        }
        const passwordMatch = await compare(
          credentials?.password || "",
          user.password
        );
        console.log("Password match:", passwordMatch);
        if (passwordMatch) {
          return { id: user.id, name: user.username };
  
        }
        return null;
      },
    }),
  ],
});

export { handler as GET, handler as POST };
