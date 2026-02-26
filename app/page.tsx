import Form from "./components/Form";
export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex min-h-screen w-screen flex-col items-center justify-center gap-16">
        <h1 className="text-3xl font-extrabold">
          Tryggve och Joys Röstverkstad
        </h1>
        <Form />
      </main>
    </div>
  );
}
