export const dynamic = "force-dynamic";

export default async function Home() {
  let message = "Loading…";
  try {
    const res = await fetch("http://localhost:3001/getHello", {
      cache: "no-store",
    });
    message = res.ok ? await res.text() : `HTTP ${res.status}`;
  } catch {
    message = "Backend unreachable";
  }

  return (
    <div>
      <h1>Whisper</h1>
      <p>Backend says: {message}</p>
    </div>
  );
}
