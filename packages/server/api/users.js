export default async function handler(req,db) {
  if (req.method === "GET") {
    const users = db
      .query(`SELECT * FROM data WHERE type = 'user' LIMIT 10`)
      .all()
      .map((u) => ({ ...u, data: JSON.parse(u.data) }));
    return new Response(JSON.stringify({ users }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response("Method Not Allowed", { status: 405 });
}
