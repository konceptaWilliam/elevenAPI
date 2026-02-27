import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { neon } from "@neondatabase/serverless";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    console.log("Registering user:", { username, password });

    const sql = neon(`${process.env.DATABASE_URL}`);
    const hashedPassword = await hash(password, 10);

    await sql`
      INSERT INTO users (username, password)
      VALUES (${username}, ${hashedPassword})
    `;

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  } catch (err: any) {
    console.log("Registration error:", err);
    if (err && err.code === "23505") {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Registration failed" },
      { status: 500 }
    );
  }
}
