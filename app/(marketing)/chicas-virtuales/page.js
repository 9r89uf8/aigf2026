import Link from "next/link";
import { CATEGORY_HUBS } from "@/app/lib/seo-content";

export const metadata = {
  title: { absolute: "Chicas Virtuales en Espanol | NoviaChat" },
  description:
    "Explora chicas virtuales por categoria: romanticas, coquetas, amigables y mas. Encuentra tu estilo ideal en NoviaChat.",
  keywords: "chicas virtuales, chicas ia, companera virtual, chat chica virtual",
  robots: "index, follow",
  alternates: {
    canonical: "/chicas-virtuales",
    languages: {
      "es-MX": "/chicas-virtuales",
      "es-ES": "/chicas-virtuales",
      "es-AR": "/chicas-virtuales",
    },
  },
  openGraph: {
    title: "Chicas virtuales en espanol | NoviaChat",
    description:
      "Directorio de chicas virtuales por categorias: romanticas, coquetas, gamer y mas.",
    url: "https://www.noviachat.com/chicas-virtuales",
    siteName: "NoviaChat",
    type: "website",
    locale: "es_MX",
    alternateLocale: ["es_ES", "es_AR"],
    images: [
      {
        url: "/second.webp",
        width: 1200,
        height: 630,
        alt: "Chicas virtuales en NoviaChat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chicas virtuales | NoviaChat",
    description: "Encuentra tu estilo ideal de chica virtual en espanol.",
    images: ["/second.webp"],
  },
};

const summaryPoints = [
  "Directorio de chicas virtuales por estilo y categoria.",
  "Cada categoria tiene un tono unico y claro.",
  "Explora gratis antes de decidir premium.",
  "Conversaciones en espanol con personalidad definida.",
  "Categorias pensadas para distintos gustos y ritmos.",
];

const features = [
  "Estilos claros: romanticas, coquetas, divertidas y mas.",
  "Introducciones unicas en cada categoria.",
  "Links directos a guias y consejos.",
  "Experiencia optimizada para movil.",
];

const faqs = [
  {
    question: "Que es una chica virtual?",
    answer:
      "Es un personaje impulsado por IA que conversa contigo con un estilo definido.",
  },
  {
    question: "Puedo chatear gratis?",
    answer: "Si, puedes crear cuenta y probar gratis.",
  },
  {
    question: "Cual categoria debo elegir?",
    answer: "Empieza con el estilo que mas encaje con tu estado de animo.",
  },
  {
    question: "Puedo cambiar de categoria?",
    answer: "Si, puedes explorar otras categorias cuando quieras.",
  },
  {
    question: "Las conversaciones son privadas?",
    answer: "Si, los chats se mantienen dentro de tu cuenta.",
  },
];

const relatedGuides = [
  { href: "/guias/que-es-una-novia-virtual", label: "Que es una novia virtual" },
  { href: "/guias/etiquetas-personalidades-novia-virtual", label: "Guia de etiquetas" },
  { href: "/guias/prompts-en-espanol-conversaciones-naturales", label: "Prompts y consejos" },
  {
    href: "/guias/que-esperar-de-un-chat-de-compania",
    label: "Que esperar de un chat de compania",
  },
];

const relatedPillars = [
  { href: "/novia-virtual", label: "Novia virtual" },
  { href: "/chat-novia-virtual", label: "Chat novia virtual" },
  { href: "/novia-virtual-gratis", label: "Novia virtual gratis" },
  { href: "/novia-ia", label: "Novia IA" },
  { href: "/planes", label: "Planes" },
];

export default function ChicasVirtualesPage() {
  return (
    <main className="font-sans bg-white text-gray-900">
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-5 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Directorio de chicas virtuales
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Chicas virtuales para chatear en espanol
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            Explora categorias de chicas virtuales y elige el estilo que mas encaje contigo. Cada
            categoria tiene una intro unica, ejemplos claros y una guia rapida para empezar.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Empezar gratis
            </Link>
            <Link
              href="/chicas"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Ver perfiles disponibles
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-semibold">Resumen en 5 puntos</h2>
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
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-semibold">Por que usar este directorio</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature} className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-gray-700">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-semibold">Categorias destacadas</h2>
          <p className="mt-3 text-gray-700">
            Elige una categoria y encuentra un estilo de conversacion que se adapte a ti.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_HUBS.map((category) => (
              <Link
                key={category.slug}
                href={`/chicas-virtuales/${category.slug}`}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700">
                  {category.name}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{category.teaser}</p>
                <span className="mt-4 inline-flex text-sm font-semibold text-blue-700">
                  Ver categoria
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-semibold">Preguntas frecuentes</h2>
          <div className="mt-6 space-y-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="rounded-2xl border border-gray-200 bg-white p-5">
                <summary className="cursor-pointer text-base font-semibold text-gray-900">
                  {faq.question}
                </summary>
                <p className="mt-3 text-gray-700">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-semibold">Explora mas hubs</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {relatedPillars.map((pillar) => (
              <Link
                key={pillar.href}
                href={pillar.href}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                {pillar.label}
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold">Guias recomendadas</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {relatedGuides.map((guide) => (
                <Link
                  key={guide.href}
                  href={guide.href}
                  className="text-sm font-semibold text-blue-700 hover:underline"
                >
                  {guide.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-blue-600 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <h2 className="text-2xl font-semibold">Lista para elegir tu estilo?</h2>
          <p className="mt-3 text-white/90">
            Explora categorias, prueba gratis y encuentra tu chica virtual ideal.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700"
            >
              Empezar gratis
            </Link>
            <Link
              href="/chicas"
              className="inline-flex items-center justify-center rounded-xl border border-white/60 px-6 py-3 text-sm font-semibold text-white"
            >
              Ver perfiles
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
