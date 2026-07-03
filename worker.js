const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const path = new URL(request.url).pathname;

    /* ---- /health – Test ob Worker + Secrets funktionieren ---- */
    if (path === "/health") {
      return new Response(JSON.stringify({
        status: "ok",
        anthropic: !!env.ANTHROPIC_KEY,
        finnhub:   !!env.FINNHUB_KEY,
      }), { headers: { ...CORS, "Content-Type": "application/json" } });
    }

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

    return new Response(JSON.stringify({ status: "Trade Sniffer Worker läuft", endpoints: ["/health", "/claude", "/finnhub"] }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  },
};
