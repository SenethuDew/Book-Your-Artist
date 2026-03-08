async function getData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/`, {
    cache: "no-store",
  });
  return res.json();
}

export default async function TestApiPage() {
  const data = await getData();

  return (
    <div style={{ padding: 24 }}>
      <h1>API Test</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
