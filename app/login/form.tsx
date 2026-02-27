"use client";
import { signIn } from "next-auth/react";
import { FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function Form() {
  const router = useRouter();
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const response = await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirect: true,
    });

    console.log(response);
    if (!response?.error) {
      router.push("/");
      console.log("Login successful");
    }
  }
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-10">
      <input
        type="username"
        name="username"
        placeholder="username"
        className="border border-black p-2"
      />
      <input type="password" name="password" placeholder="password" />
      <button type="submit">Logga in</button>
    </form>
  );
}
