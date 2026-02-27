"use client";
import { signIn } from "next-auth/react";
import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-5">
      <Input
        className="w-[200px]"
        type="username"
        name="username"
        placeholder="Username"
      />
      <Input
        className="w-[200px]"
        type="password"
        name="password"
        placeholder="Password"
      />
      <Button type="submit">Logga in</Button>
    </form>
  );
}
