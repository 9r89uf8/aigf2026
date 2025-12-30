// app/sitemap.js
import { CATEGORY_HUBS, GUIDE_PAGES } from "@/app/lib/seo-content";

export default function sitemap() {
  const baseUrl = "https://www.noviachat.com";

  const coreRoutes = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/novia-virtual`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/chat-novia-virtual`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/chicas-virtuales`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/novia-virtual-gratis`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/novia-ia`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/como-funciona`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/noviachat-en-1-minuto`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/planes`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/privacidad-seguridad`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/centro-de-seguridad`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/preguntas-frecuentes`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/chicas-ia`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/sobre-noviachat`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/prensa`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/support`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terminos`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const categoryRoutes = CATEGORY_HUBS.map((category) => ({
    url: `${baseUrl}/chicas-virtuales/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const guideRoutes = GUIDE_PAGES.map((guide) => ({
    url: `${baseUrl}/guias/${guide.slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...coreRoutes, ...categoryRoutes, ...guideRoutes];
}
