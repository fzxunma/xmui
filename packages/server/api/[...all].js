export default async function (req) {
  return new Response(JSON.stringify({ code: 404, msg: "Invalid API path" }), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
