import Form from "./components/Form";
export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center">
        <Form />
      </main>
    </div>
  );
}
