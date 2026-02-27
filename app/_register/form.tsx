"use client";
import { FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function Form() {
  const router = useRouter();
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
      }),
    });
    console.log("Response status:", response.status);
    if (response.ok) {
      router.push("/login");
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
      <button type="submit">Registrera dig</button>
    </form>
  );
}
