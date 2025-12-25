import Link from "next/link";
import { fetchPublicGirls, fetchPublicPlans } from "@/app/lib/convex-public";
import { formatMoney } from "@/app/lib/currency";

export const metadata = {
  title: { absolute: "NoviaChat en 1 minuto" },
  description:
    "Resumen rapido de NoviaChat: que es, funciones, catalogo, precios y seguridad.",
  keywords:
    "noviachat en 1 minuto, resumen noviachat, precios noviachat, seguridad noviachat",
  robots: "index, follow",
  alternates: {
    canonical: "/noviachat-en-1-minuto",
    languages: {
      "es-MX": "/noviachat-en-1-minuto",
      "es-ES": "/noviachat-en-1-minuto",
      "es-AR": "/noviachat-en-1-minuto",
    },
  },
  openGraph: {
    title: "NoviaChat en 1 minuto",
    description: "Resumen rapido de NoviaChat en espanol.",
    url: "https://www.noviachat.com/noviachat-en-1-minuto",
    siteName: "NoviaChat",
    type: "website",
    locale: "es_MX",
    alternateLocale: ["es_ES", "es_AR"],
    images: [
      {
        url: "/second.webp",
        width: 1200,
        height: 630,
        alt: "Resumen NoviaChat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NoviaChat en 1 minuto",
    description: "Que es NoviaChat, que ofrece y como se usa.",
    images: ["/second.webp"],
  },
};

const quickFacts = [
  {
    title: "Que es",
    description: "Una companera virtual con IA en espanol, enfocada en conversaciones personalizadas.",
  },
  {
    title: "Idiomas y regiones",
    description: "Espanol con foco en Mexico, Espana y Argentina.",
  },
  {
    title: "Plataforma",
    description: "Web y movil primero, lista para usar en minutos.",
  },
  {
    title: "Para quien es",
    description: "Personas que buscan compania conversacional, romance o practica en espanol.",
  },
];

const keyFeatures = [
  {
    title: "Memoria conversacional",
    description: "Recuerda datos y mantiene el contexto para conversaciones mas naturales.",
  },
  {
    title: "Contenido multimedia",
    description: "Fotos, videos y audios para una experiencia mas completa.",
  },
  {
    title: "Estilos y personalidades",
    description: "Perfiles con distintos tonos para elegir tu favorita.",
  },
  {
    title: "Privacidad y control",
    description: "Herramientas de reporte y politicas claras de seguridad.",
  },
];

const safetyPoints = [
  "Servicio de entretenimiento con personajes de IA.",
  "Contenido adulto solo para mayores de edad.",
  "Puedes mantener conversaciones romanticas (SFW) si lo prefieres.",
  "Reportes y limites de seguridad disponibles.",
  "Politicas y privacidad accesibles desde el sitio.",
];

const currencyOrder = ["MXN", "EUR", "ARS"];

export default async function NoviaChatEnUnMinutoPage() {
  const [plans, girls] = await Promise.all([fetchPublicPlans(), fetchPublicGirls()]);
  const previewGirls = girls.slice(0, 6);
  const hasGirls = girls.length > 0;

  return (
    <main className="font-sans bg-white text-gray-900">
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-5 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            NoviaChat en 1 minuto
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Todo lo esencial para recomendar NoviaChat rapido
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            Resumen claro de que es, que ofrece, cuanto cuesta y como maneja la seguridad.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/girls"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Ver catalogo
            </Link>
            <Link
              href="/plans"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Ver precios
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Resumen rapido</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {quickFacts.map((fact) => (
              <article key={fact.title} className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-gray-900">{fact.title}</h3>
                <p className="mt-2 text-gray-700">{fact.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Funciones clave</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {keyFeatures.map((item) => (
              <article key={item.title} className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-gray-700">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Precios (premium) y acceso gratis</h2>
          <p className="mt-3 text-gray-700">
            Puedes empezar gratis y luego elegir un plan premium si quieres mas contenido o
            multimedia. Los precios pueden variar por moneda.
          </p>
          {plans.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-700">
              Los planes no estan disponibles en este momento. Revisa los precios actualizados en{" "}
              <Link href="/plans" className="font-semibold text-blue-600 hover:underline">
                /plans
              </Link>
              .
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Duracion</th>
                    {currencyOrder.map((ccy) => (
                      <th key={ccy} className="px-4 py-3">
                        {ccy}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => {
                    const localized = plan.localized || {};
                    return (
                      <tr key={plan.productId} className="border-t border-gray-200">
                        <td className="px-4 py-3 font-semibold text-gray-900">{plan.name}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {plan.durationDays} dia{plan.durationDays !== 1 ? "s" : ""}
                        </td>
                        {currencyOrder.map((ccy) => {
                          const amount = localized[ccy];
                          return (
                            <td key={ccy} className="px-4 py-3 text-gray-700">
                              {amount != null ? formatMoney(ccy, amount) : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-sm text-gray-600">
            Para detalles completos, visita{" "}
            <Link href="/plans" className="font-semibold text-blue-600 hover:underline">
              la pagina de planes
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Catalogo de companeras</h2>
              <p className="mt-2 text-gray-700">
                {hasGirls
                  ? `Hay ${girls.length} perfiles publicos activos con estilos distintos.`
                  : "Catalogo en actualizacion. Vuelve pronto para nuevas companeras."}
              </p>
            </div>
            <Link
              href="/girls"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Ver catalogo completo
            </Link>
          </div>
          {previewGirls.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-700">
              El catalogo publico no esta disponible ahora mismo. Visita{" "}
              <Link href="/girls" className="font-semibold text-blue-600 hover:underline">
                /girls
              </Link>{" "}
              para intentarlo de nuevo.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {previewGirls.map((girl) => (
                <article key={girl._id} className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{girl.name}</h3>
                    {girl.premiumOnly && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                        Premium
                      </span>
                    )}
                  </div>
                  {girl.bio ? (
                    <p className="mt-2 text-sm text-gray-700 line-clamp-3">{girl.bio}</p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">
                      Perfil disponible para conversar en espanol.
                    </p>
                  )}
                  <Link
                    href={`/girls/${girl._id}`}
                    className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:underline"
                  >
                    Ver perfil
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Seguridad y limites</h2>
          <ul className="mt-4 space-y-3 text-gray-700">
            {safetyPoints.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  ✓
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/centro-de-seguridad"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Centro de seguridad
            </Link>
            <Link
              href="/privacidad-seguridad"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Privacidad y seguridad
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-blue-600 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <h2 className="text-2xl font-semibold">Listo para probar?</h2>
          <p className="mt-3 text-white/90">
            Empieza gratis en minutos y decide despues si quieres premium.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700"
            >
              Crear cuenta
            </Link>
            <Link
              href="/como-funciona"
              className="inline-flex items-center justify-center rounded-xl border border-white/60 px-6 py-3 text-sm font-semibold text-white"
            >
              Como funciona
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
