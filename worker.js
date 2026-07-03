addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const path = new URL(request.url).pathname;

  if (path === "/health") {
    return new Response(JSON.stringify({
      ok: true,
      anthropic: typeof ANTHROPIC_KEY !== "undefined" && ANTHROPIC_KEY !== "",
      finnhub:   typeof FINNHUB_KEY   !== "undefined" && FINNHUB_KEY   !== ""
    }), { headers: { ...CORS, "Content-Type": "application/json" } });
  }

  if (path === "/finnhub") {
    try {
      const { endpoint, params } = await request.json();
      const url = new URL("https://finnhub.io/api/v1/" + endpoint);
      if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      url.searchParams.set("token", FINNHUB_KEY);
      const resp = await fetch(url.toString());
      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" }
      });
    }
  }

  if (path === "/claude") {
    try {
      const body = await request.json();
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify(body)
      });
      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" }
      });
    }
  }


  if (path === "/test-finnhub") {
    try {
      const url = new URL("https://finnhub.io/api/v1/quote");
      url.searchParams.set("symbol", "NVDA");
      url.searchParams.set("token", FINNHUB_KEY);
      const resp = await fetch(url.toString());
      const data = await resp.json();
      return new Response(JSON.stringify({ raw: data, key_length: FINNHUB_KEY.length }), {
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" }
      });
    }
  }

  return new Response(JSON.stringify({ status: "Trade Sniffer Worker aktiv" }), {
    headers: { ...CORS, "Content-Type": "application/json" }
  });
}

/* Temporärer Test-Endpunkt – direkt im Browser aufrufbar */
