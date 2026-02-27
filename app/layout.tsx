import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import "./globals.css";
import Providers from "./providers";
import Form from "./login/form";

export const metadata: Metadata = {
  title: "Tryggve och Joys Röstverkstad",
  description: "Här skapar vi röster till Tryggve och Joy",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (!session) {
    return (
      <html lang="en">
        <body className="flex flex-col justify-center items-center h-screen">
          <h1 className="text-3xl font-extrabold">
            Tryggve och Joys Röstverkstad
          </h1>
          <Form />
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
