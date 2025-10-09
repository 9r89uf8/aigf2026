// app/api/geo/route.js
import { headers } from "next/headers";

export async function GET() {
  const h = headers();
  const country = (
    h.get("x-vercel-ip-country") || // Vercel
    h.get("cf-ipcountry") ||        // Cloudflare
    h.get("cf-ip-country") ||       // Some CF setups
    h.get("x-country") ||           // Custom reverse proxies
    ""
  ).toUpperCase();

  return Response.json({ country });
}
