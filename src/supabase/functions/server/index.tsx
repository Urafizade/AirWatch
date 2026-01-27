import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-203376f4/health", (c) => {
  return c.json({ status: "ok" });
});

// AQ Tile endpoint: returns a coarse world grid of AQI samples.
// POST body: { cols?: number, rows?: number }
app.post('/make-server-203376f4/aqtiles', async (c) => {
  try {
    const body = await c.req.json();
    const cols = Number(body?.cols) || 40;
    const rows = Number(body?.rows) || 20;

    const apiKey = Deno.env.get('GOOGLE_AIR_QUALITY_API_KEY') || Deno.env.get('VITE_GOOGLE_AIR_QUALITY_API_KEY');
    if (!apiKey) return c.json({ error: 'Missing server AIR QUALITY API key' }, 500);

    const tiles: Array<{ xPct: number; yPct: number; lat: number; lng: number; aqi: number | null }> = [];

    // helper: cached fetch of AQI for a lat/lng using kv store
    const fetchAqi = async (lat: number, lng: number) => {
      const key = `aq:${lat.toFixed(3)}:${lng.toFixed(3)}`;
      try {
        const cached = await kv.get(key);
        if (cached && cached.aqi !== undefined && Date.now() - (cached.ts || 0) < 1000 * 60 * 10) {
          return cached.aqi as number;
        }
      } catch (e) {
        // ignore cache errors
      }

      const endpoint = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${encodeURIComponent(String(apiKey))}`;
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            universalAqi: true,
            location: { latitude: lat, longitude: lng }
          })
        });
        if (!res.ok) {
          return null;
        }
        const data = await res.json();
        const aqi = Array.isArray(data.indexes) ? (data.indexes[0]?.aqi ?? null) : (data.indexes?.aqi ?? null);
        try { await kv.set(key, { aqi, ts: Date.now() }); } catch (e) {}
        return typeof aqi === 'number' ? aqi : null;
      } catch (err) {
        return null;
      }
    };

    for (let r = 0; r < rows; r++) {
      for (let cidx = 0; cidx < cols; cidx++) {
        const x = (cidx + 0.5) / cols * 100;
        const y = (r + 0.5) / rows * 100;
        const lng = (x / 100) * 360 - 180;
        const lat = 90 - (y / 100) * 180;
        const aqi = await fetchAqi(lat, lng);
        tiles.push({ xPct: x, yPct: y, lat, lng, aqi });
      }
    }

    return c.json({ tiles });
  } catch (err) {
    console.error('aqtiles error', err);
    return c.json({ error: String(err) }, 500);
  }
});

// Reverse geocode endpoint: accept { lat, lng } and return a Location-like object
app.post('/make-server-203376f4/reverse-geocode', async (c) => {
  try {
    const body = await c.req.json();
    const lat = Number(body?.lat);
    const lng = Number(body?.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return c.json({ error: 'Invalid lat/lng' }, 400);

    const apiKey = Deno.env.get('GOOGLE_GEOCODING_API_KEY') || Deno.env.get('VITE_GOOGLE_GEOCODING_API_KEY');
    if (!apiKey) return c.json({ error: 'Missing server GEOCODING API key' }, 500);

    const cacheKey = `rev:${lat.toFixed(3)}:${lng.toFixed(3)}`;
    try {
      const cached = await kv.get(cacheKey);
      if (cached && cached.value) return c.json(cached.value);
    } catch (e) {}

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(lat + ',' + lng)}&key=${encodeURIComponent(String(apiKey))}`;
    const res = await fetch(url);
    if (!res.ok) return c.json({ error: 'Geocoding failed' }, 502);
    const data = await res.json();
    const first = Array.isArray(data.results) ? data.results[0] : null;
    if (!first) return c.json({ error: 'No geocoding result' }, 404);

    const getComponent = (types: string[]) => {
      const comp = first.address_components?.find((c: any) => c.types?.some((t: string) => types.includes(t)));
      return comp?.long_name || comp?.short_name || undefined;
    };

    const name = first.formatted_address || getComponent(['locality', 'administrative_area_level_1']) || 'Unknown';
    const country = getComponent(['country']) || '';
    const placeId = first.place_id || `rev-${lat.toFixed(3)}-${lng.toFixed(3)}`;

    const location = {
      id: placeId,
      name,
      country,
      coordinates: { lat, lng },
      timezone: 'UTC'
    };

    try { await kv.set(cacheKey, { value: location }); } catch (e) {}

    return c.json(location);
  } catch (err) {
    console.error('reverse-geocode error', err);
    return c.json({ error: String(err) }, 500);
  }
});

// Proxy Google Air Quality heatmap tile request to avoid exposing API key to clients.
// GET /make-server-203376f4/heatmap-tile?z=Z&x=X&y=Y
app.get('/make-server-203376f4/heatmap-tile', async (c) => {
  try {
    const reqUrl = new URL(c.req.url);
    const z = Number(reqUrl.searchParams.get('z'));
    const x = Number(reqUrl.searchParams.get('x'));
    const y = Number(reqUrl.searchParams.get('y'));
    if ([z, x, y].some((v) => Number.isNaN(v))) return c.json({ error: 'missing params' }, 400);

    const apiKey = Deno.env.get('GOOGLE_AIR_QUALITY_API_KEY') || Deno.env.get('VITE_GOOGLE_AIR_QUALITY_API_KEY');
    if (!apiKey) return c.json({ error: 'Missing AIR QUALITY API key' }, 500);

    // Validate tile coordinates for zoom
    const max = Math.pow(2, z);
    if (y < 0 || y >= max) return c.json({ error: 'Invalid tile Y' }, 400);

    const gUrl = `https://airquality.googleapis.com/v1/mapTypes/UAQI_RED_GREEN/heatmapTiles/${z}/${x}/${y}?key=${encodeURIComponent(String(apiKey))}`;
    const res = await fetch(gUrl);
    if (!res.ok) {
      const txt = await res.text();
      console.error('Heatmap tile fetch failed', res.status, txt);
      return c.json({ error: 'Heatmap fetch failed' }, res.status);
    }
    const buf = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/png';
    return c.body(new Uint8Array(buf), 200, { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=300' });
  } catch (err) {
    console.error('heatmap-tile error', err);
    return c.json({ error: String(err) }, 500);
  }
});

Deno.serve(app.fetch);