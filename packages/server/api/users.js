export default async function handler(req) {
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ message: "Welcome to the homepage!ddd" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  return new Response("Method Not Allowed", { status: 405 });
}