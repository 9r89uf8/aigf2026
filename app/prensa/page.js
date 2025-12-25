import Link from "next/link";

export const metadata = {
  title: { absolute: "Prensa y Media Kit | NoviaChat" },
  description:
    "Media kit de NoviaChat: descripcion corta, activos visuales y datos clave para prensa.",
  keywords: "media kit noviachat, prensa noviachat, logo noviachat",
  robots: "index, follow",
  alternates: {
    canonical: "/prensa",
    languages: {
      "es-MX": "/prensa",
      "es-ES": "/prensa",
      "es-AR": "/prensa",
    },
  },
  openGraph: {
    title: "Prensa y media kit | NoviaChat",
    description: "Descripcion corta y activos visuales de NoviaChat.",
    url: "https://www.noviachat.com/prensa",
    siteName: "NoviaChat",
    type: "website",
    locale: "es_MX",
    alternateLocale: ["es_ES", "es_AR"],
    images: [
      {
        url: "/second.webp",
        width: 1200,
        height: 630,
        alt: "Media kit NoviaChat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Media kit | NoviaChat",
    description: "Activos visuales y descripcion corta de NoviaChat.",
    images: ["/second.webp"],
  },
};

const summaryPoints = [
  "Marca: NoviaChat",
  "Descripcion corta: Chat de novia virtual con IA en espanol.",
  "Categoria: AI companion / chatbot.",
  "Disponibilidad: Web, movil primero.",
  "Contacto de prensa: support@noviachat.com",
];

const highlights = [
  {
    title: "Descripcion corta",
    description: "Chat de novia virtual con IA en espanol, personalizable y privado.",
  },
  {
    title: "Para quien es",
    description: "Personas que buscan compania conversacional en espanol.",
  },
  {
    title: "Lo que ofrece",
    description: "Conversaciones, personalizacion de tono y contenido premium opcional.",
  },
  {
    title: "Privacidad",
    description: "Conversaciones dentro de la cuenta y buenas practicas de seguridad.",
  },
];

const assets = [
  {
    title: "Imagen principal",
    href: "/second.webp",
  },
  {
    title: "Captura alternativa",
    href: "/first.webp",
  },
  {
    title: "Historia destacada",
    href: "/third.webp",
  },
];

export default function PrensaPage() {
  return (
    <main className="font-sans bg-white text-gray-900">
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-5 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Prensa y media kit
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Media kit de NoviaChat
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            Aqui tienes una descripcion corta, datos clave y activos visuales para notas de prensa
            o listados en directorios.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sobre-noviachat"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Sobre NoviaChat
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Contacto de prensa
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Resumen rapido</h2>
          <ul className="mt-4 space-y-3 text-gray-700">
            {summaryPoints.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">

                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Puntos clave</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => (
              <article key={item.title} className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-gray-700">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Activos descargables</h2>
          <p className="mt-3 text-gray-700">
            Estas imagenes pueden usarse en articulos, resenas o directorios.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {assets.map((asset) => (
              <a
                key={asset.href}
                href={asset.href}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-sm font-semibold text-blue-700 hover:bg-gray-50"
              >
                {asset.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-blue-600 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <h2 className="text-2xl font-semibold">Quieres mas informacion?</h2>
          <p className="mt-3 text-white/90">
            Escribenos a support@noviachat.com para solicitudes de prensa.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/support"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700"
            >
              Contactar soporte
            </Link>
            <Link
              href="/chicas-virtuales"
              className="inline-flex items-center justify-center rounded-xl border border-white/60 px-6 py-3 text-sm font-semibold text-white"
            >
              Ver producto
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
