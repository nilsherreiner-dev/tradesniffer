/**
 * TRADE SNIFFER – Cloudflare Worker Proxy
 * 
 * Dieser Worker leitet Anfragen sicher an Anthropic und Finnhub weiter.
 * Die API-Schlüssel sind als verschlüsselte Secrets in Cloudflare gespeichert
 * und erscheinen niemals in der index.html.
 * 
 * Secrets die du in Cloudflare eintragen musst:
 *   ANTHROPIC_KEY  →  dein Anthropic API-Schlüssel
 *   FINNHUB_KEY    →  dein Finnhub API-Schlüssel
 */

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url  = new URL(request.url);
    const path = url.pathname;

    /* ---- /claude ---- */
    if (path === "/claude") {
      try {
        const body = await request.json();
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type":      "application/json",
            "x-api-key":         env.ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify(body),
        });
        const data = await resp.json();
        return new Response(JSON.stringify(data), {
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
    }

    /* ---- /finnhub ---- */
    if (path === "/finnhub") {
      try {
        const { endpoint, params } = await request.json();
        const target = new URL(`https://finnhub.io/api/v1/${endpoint}`);
        if (params) Object.entries(params).forEach(([k,v]) => target.searchParams.set(k,v));
        target.searchParams.set("token", env.FINNHUB_KEY);
        const resp = await fetch(target.toString());
        const data = await resp.json();
        return new Response(JSON.stringify(data), {
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Not found", { status: 404, headers: CORS });
  },
};
