import Link from "next/link";

export const metadata = {
  title: { absolute: "Centro de seguridad | NoviaChat" },
  description:
    "Politicas, limites y recursos de seguridad para usar NoviaChat de forma responsable.",
  keywords: "seguridad noviachat, centro de seguridad, limites noviachat",
  robots: "index, follow",
  alternates: {
    canonical: "/centro-de-seguridad",
    languages: {
      "es-MX": "/centro-de-seguridad",
      "es-ES": "/centro-de-seguridad",
      "es-AR": "/centro-de-seguridad",
    },
  },
  openGraph: {
    title: "Centro de seguridad | NoviaChat",
    description: "Limites, reportes y politicas de seguridad de NoviaChat.",
    url: "https://www.noviachat.com/centro-de-seguridad",
    siteName: "NoviaChat",
    type: "website",
    locale: "es_MX",
    alternateLocale: ["es_ES", "es_AR"],
    images: [
      {
        url: "/second.webp",
        width: 1200,
        height: 630,
        alt: "Centro de seguridad NoviaChat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Centro de seguridad | NoviaChat",
    description: "Limites y reportes para usar NoviaChat de forma segura.",
    images: ["/second.webp"],
  },
};

const commitments = [
  "Servicio de entretenimiento con personajes de IA, no personas reales.",
  "Contenido adulto solo para mayores de 18 anos.",
  "Politicas claras para evitar contenido ilegal o peligroso.",
  "Canales de reporte accesibles para usuarios.",
];

const allowed = [
  "Conversaciones romanticas o de compania (SFW).",
  "Contenido adulto consensuado entre mayores de edad.",
  "Uso para practica conversacional en espanol.",
  "Explorar estilos y personalidades de IA de forma segura.",
];

const notAllowed = [
  "Contenido sexual con menores o referencias a menores.",
  "Coaccion, violencia sexual o actividades ilegales.",
  "Intentos de suplantacion o fraude.",
  "Compartir datos personales sensibles sin consentimiento.",
];

const reporting = [
  "Reporta contenido inapropiado desde la app cuando sea posible.",
  "Contacta soporte en support@noviachat.com con enlaces o capturas.",
  "Incluye fecha, hora y detalles para ayudar a investigar.",
];

export default function CentroDeSeguridadPage() {
  return (
    <main className="font-sans bg-white text-gray-900">
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-5 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Centro de seguridad
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Usa NoviaChat de forma segura y responsable
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            Aqui resumimos limites de contenido, recomendaciones y recursos de ayuda.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/privacidad-seguridad"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Privacidad y seguridad
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Contactar soporte
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Compromisos clave</h2>
          <ul className="mt-4 space-y-3 text-gray-700">
            {commitments.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  ✓
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-2xl font-semibold">Uso permitido</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
                {allowed.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-2xl font-semibold">No permitido</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
                {notAllowed.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Reportes y ayuda</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
            {reporting.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-gray-600">
            Si necesitas mas detalles, revisa las{" "}
            <Link href="/terminos" className="font-semibold text-blue-600 hover:underline">
              politicas y terminos
            </Link>{" "}
            de uso.
          </p>
        </div>
      </section>

      <section className="bg-blue-600 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <h2 className="text-2xl font-semibold">Transparencia y privacidad</h2>
          <p className="mt-3 text-white/90">
            Consulta como protegemos tus datos y como puedes gestionar tu cuenta.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/privacy"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700"
            >
              Politica de privacidad
            </Link>
            <Link
              href="/account"
              className="inline-flex items-center justify-center rounded-xl border border-white/60 px-6 py-3 text-sm font-semibold text-white"
            >
              Gestionar cuenta
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
