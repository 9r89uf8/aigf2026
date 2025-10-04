// app/api/geo/route.js
import { geolocation } from "@vercel/functions";

// Optional but recommended (Edge is fastest for geo)
export const runtime = "edge";

export async function GET(request) {
    const geo = geolocation(request) || {};
    // Fallback header also works on Vercel (handy for local/Node runtime)
    const headerCountry = request.headers.get("x-vercel-ip-country") || "";
    const country = (geo.country || headerCountry || (process.env.NODE_ENV === 'development' ? 'MX' : '')).toUpperCase();
    const code = /^[A-Z]{2}$/.test(country) ? country : ""; // sanitize


    return new Response(JSON.stringify({ country: code }), {
        headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
}
