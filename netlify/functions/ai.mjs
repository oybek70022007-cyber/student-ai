const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });

async function handle(req) {
  if (req.method !== "POST") return json({ error: "Faqat POST so'rov qabul qilinadi" }, 405);
  const key = (process.env.GROQ_API_KEY || "").trim();
  if (!key) return json({ error: "Serverda GROQ_API_KEY sozlanmagan" }, 500);

  const su = (process.env.SUPABASE_URL || "").trim(), sk = (process.env.SUPABASE_ANON_KEY || "").trim();
  if (su && sk) {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Avval tizimga kiring" }, 401);
    const r = await fetch(su.replace(/\/$/, "") + "/auth/v1/user", {
      headers: { apikey: sk, Authorization: "Bearer " + token },
    });
    if (!r.ok) return json({ error: "Sessiya yaroqsiz. Qayta kiring" }, 401);
  }

  const b = await req.json();
  const msgs = Array.isArray(b.messages) ? b.messages : null;
  if (!msgs || !msgs.length || msgs.length > 12) return json({ error: "messages noto'g'ri" }, 400);
  const clean = msgs.map((m) => ({
    role: ["system", "user", "assistant"].includes(m.role) ? m.role : "user",
    content: String(m.content || "").slice(0, 60000),
  }));

  const payload = {
    model: (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim(),
    messages: clean,
    temperature: Math.min(Math.max(Number(b.temperature) || 0.6, 0), 1.2),
    max_tokens: Math.min(Math.max(Number(b.max_tokens) || 3000, 100), 8000),
  };
  if (b.json) payload.response_format = { type: "json_object" };

  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify(payload),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) return json({ error: "Groq (" + r.status + "): " + (d?.error?.message || "noma'lum xato") }, r.status === 429 ? 429 : 502);
  return json({ text: d.choices?.[0]?.message?.content || "" });
}

export default async (req) => {
  try {
    return await handle(req);
  } catch (e) {
    return json({ error: "Server xatosi: " + (e && e.message ? e.message : String(e)) }, 500);
  }
};

