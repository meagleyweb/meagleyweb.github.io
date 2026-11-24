/* meagley.tech: a small private visitor counter. Pages themselves are served as plain files and never touch this code.
   No cookies, and no IP addresses are stored: a visitor is a scrambled code that changes every day and is deleted the next day. */
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const dayOf = (ms = Date.now()) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms)); // 2026-11-24
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
const sha = async s => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|curl|wget|python|monitor|uptime|scan/i;
const EVENTS = ["contact", "questionnaire"];

async function hit(req, env) {
  const none = new Response(null, { status: 204 });
  if (req.headers.get("origin") !== "https://meagley.tech") return none;
  const ua = req.headers.get("user-agent") || "";
  if (!ua || BOT.test(ua)) return none;
  const raw = await req.text(); if (raw.length > 400) return none;
  let b; try { b = JSON.parse(raw); } catch { return none; }
  const DB = env.DB, day = dayOf();
  /* new day: keep yesterday's total, throw away the visitor codes and the old scrambling key */
  let salt = await DB.prepare("SELECT salt FROM salts WHERE day=?").bind(day).first();
  if (!salt) {
    await DB.batch([
      DB.prepare("INSERT OR REPLACE INTO totals(day,visitors) SELECT day,COUNT(*) FROM visitors WHERE day<? GROUP BY day").bind(day),
      DB.prepare("DELETE FROM visitors WHERE day<?").bind(day),
      DB.prepare("DELETE FROM salts WHERE day<?").bind(day),
      DB.prepare("INSERT OR IGNORE INTO salts(day,salt) VALUES(?,?)").bind(day, hex(crypto.getRandomValues(new Uint8Array(16))))
    ]);
    salt = await DB.prepare("SELECT salt FROM salts WHERE day=?").bind(day).first();
  }
  const id = (await sha(salt.salt + "|" + (req.headers.get("cf-connecting-ip") || "") + "|" + ua)).slice(0, 20);
  const v = await DB.prepare("INSERT INTO visitors(day,id,n) VALUES(?,?,1) ON CONFLICT(day,id) DO UPDATE SET n=n+1 RETURNING n").bind(day, id).first();
  if (v.n > 150) return none; // one device can't flood the numbers
  if (b.e) { if (EVENTS.includes(b.e)) await DB.prepare("INSERT INTO events(day,name,n) VALUES(?,?,1) ON CONFLICT(day,name) DO UPDATE SET n=n+1").bind(day, b.e).run(); return none; }
  const path = /^\/(?:(?:questionnaire|setup|privacy|thanks)\/|work\/[a-z0-9/_-]{1,60})?$/.test(b.p) ? b.p : "other";
  const jobs = [DB.prepare("INSERT INTO hits(day,path,n) VALUES(?,?,1) ON CONFLICT(day,path) DO UPDATE SET n=n+1").bind(day, path)];
  if (b.r) {
    let r = String(b.r).toLowerCase().replace(/^www\./, "");
    if (r === "google ads") r = "Google Ads"; else if (!/^[a-z0-9.-]{3,60}$/.test(r)) r = "other";
    const n = await DB.prepare("SELECT COUNT(*) n FROM refs WHERE day=?").bind(day).first();
    if (n.n >= 80 && !(await DB.prepare("SELECT 1 FROM refs WHERE day=? AND ref=?").bind(day, r).first())) r = "other";
    jobs.push(DB.prepare("INSERT INTO refs(day,ref,n) VALUES(?,?,1) ON CONFLICT(day,ref) DO UPDATE SET n=n+1").bind(day, r));
  }
  await DB.batch(jobs);
  return none;
}

async function stats(req, env) {
  const key = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  if (!env.STATS_KEY || await sha(key) !== await sha(env.STATS_KEY)) return json({ error: "That link isn't right. Use the full private link." }, 401);
  const day = dayOf(), from = dayOf(Date.now() - 89 * 864e5), DB = env.DB, q = (s, ...a) => DB.prepare(s).bind(...a);
  const [t, v, h, p, r, e] = await DB.batch([
    q("SELECT day,visitors n FROM totals WHERE day>=?", from), q("SELECT day,COUNT(*) n FROM visitors GROUP BY day"),
    q("SELECT day,SUM(n) n FROM hits WHERE day>=? GROUP BY day", from), q("SELECT day,path,n FROM hits WHERE day>=?", from),
    q("SELECT day,ref,n FROM refs WHERE day>=?", from), q("SELECT day,name,n FROM events WHERE day>=?", from)
  ]);
  return json({ today: day, visitors: t.results.concat(v.results), views: h.results, pages: p.results, refs: r.results, events: e.results });
}

export default {
  async fetch(req, env) {
    const p = new URL(req.url).pathname;
    try {
      if (p === "/api/hit" && req.method === "POST") return await hit(req, env);
      if (p === "/api/stats" && req.method === "GET") return await stats(req, env);
    } catch (e) { console.log(p, e.stack || e.message); return p === "/api/hit" ? new Response(null, { status: 204 }) : json({ error: "Couldn't load the numbers. Try again." }, 500); }
    return env.ASSETS.fetch(req);
  }
};
