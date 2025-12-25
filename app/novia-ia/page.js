import Link from "next/link";

export const metadata = {
  title: { absolute: "Novia IA en Espanol | NoviaChat" },
  description:
    "Encuentra tu novia IA en espanol: conversacion personalizada, memoria y privacidad con NoviaChat.",
  keywords: "novia IA, novia inteligencia artificial, novia ia en espanol, novia virtual IA",
  robots: "index, follow",
  alternates: {
    canonical: "/novia-ia",
    languages: {
      "es-MX": "/novia-ia",
      "es-ES": "/novia-ia",
      "es-AR": "/novia-ia",
    },
  },
  openGraph: {
    title: "Novia IA en espanol | NoviaChat",
    description:
      "Conoce una novia IA en espanol con respuestas naturales, personalizacion y privacidad.",
    url: "https://www.noviachat.com/novia-ia",
    siteName: "NoviaChat",
    type: "website",
    locale: "es_MX",
    alternateLocale: ["es_ES", "es_AR"],
    images: [
      {
        url: "/second.webp",
        width: 1200,
        height: 630,
        alt: "Novia IA en NoviaChat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Novia IA en espanol | NoviaChat",
    description: "Novia IA con conversaciones naturales y privadas en espanol.",
    images: ["/second.webp"],
  },
};

const summaryPoints = [
  "Novia IA con personalidad definida y conversacion realista.",
  "Responde en espanol con tono natural.",
  "Memoria conversacional para seguir tu historia.",
  "Privacidad y control sobre el tono.",
  "Puedes empezar gratis y decidir despues.",
];

const features = [
  "IA optimizada para espanol latino y europeo.",
  "Ajustes de tono: romantico, amigable o coqueta.",
  "Conversaciones continuas con contexto.",
  "Acceso desde movil con carga rapida.",
];

const highlights = [
  {
    title: "Personalidad consistente",
    description: "La IA mantiene un estilo coherente durante la conversacion.",
  },
  {
    title: "Memoria de detalles",
    description: "Recuerda gustos y temas para conversaciones mas reales.",
  },
  {
    title: "Espanol natural",
    description: "Respuestas claras sin sonar genericas.",
  },
  {
    title: "Ritmo ajustable",
    description: "Pide respuestas mas rapidas o mas calmadas.",
  },
  {
    title: "Multimedia opcional",
    description: "Fotos, videos o audios cuando activas premium.",
  },
  {
    title: "Privacidad clara",
    description: "Tus conversaciones quedan dentro de tu cuenta.",
  },
  {
    title: "Categoria ideal",
    description: "Elige el estilo que mejor encaje contigo.",
  },
  {
    title: "Cambio flexible",
    description: "Puedes cambiar de chica IA cuando quieras.",
  },
];

const faqs = [
  {
    question: "Que es una novia IA?",
    answer:
      "Es una companera virtual impulsada por inteligencia artificial con personalidad y tono definido.",
  },
  {
    question: "Habla en espanol real?",
    answer: "Si, NoviaChat esta optimizado para espanol natural.",
  },
  {
    question: "Puedo personalizar el estilo?",
    answer: "Si, puedes ajustar tono, ritmo y temas.",
  },
  {
    question: "Es privado?",
    answer: "Si, las conversaciones se mantienen dentro de tu cuenta.",
  },
  {
    question: "Se puede empezar gratis?",
    answer: "Si, puedes iniciar gratis y luego decidir.",
  },
];

const relatedCategories = [
  { href: "/chicas-virtuales/romanticas", label: "Romanticas" },
  { href: "/chicas-virtuales/timidas", label: "Timidas" },
  { href: "/chicas-virtuales/maduras", label: "Maduras" },
];

const relatedGuides = [
  { href: "/guias/novia-ia-en-espanol-como-elegir", label: "Como elegir la mejor" },
  { href: "/guias/que-es-una-novia-virtual", label: "Que es una novia virtual" },
  { href: "/guias/seguridad-privacidad-chats-ia", label: "Seguridad y privacidad" },
];

export default function NoviaIaPage() {
  return (
    <main className="font-sans bg-white text-gray-900">
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-5 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Novia IA en espanol
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Novia IA con conversacion personalizada en espanol
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            Con NoviaChat puedes hablar con una novia IA que recuerda tu estilo y responde con
            naturalidad. Personaliza el tono, manten conversaciones privadas y elige el ritmo que
            prefieres.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Probar gratis
            </Link>
            <Link
              href="/chicas-virtuales"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Ver chicas virtuales
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-5xl px-4">
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
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Lo esencial de una novia IA</h2>
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
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Por que se siente real</h2>
          <p className="mt-3 text-gray-700">
            Estos elementos hacen que la experiencia con novia IA sea mas cercana.
          </p>
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
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Explora mas hubs</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/chat-novia-virtual"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Chat novia virtual
            </Link>
            <Link
              href="/novia-virtual"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Novia virtual
            </Link>
            <Link
              href="/chicas-virtuales"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Chicas virtuales
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold">Categorias relacionadas</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {relatedCategories.map((category) => (
                  <Link
                    key={category.href}
                    href={category.href}
                    className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    {category.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Guias recomendadas</h3>
              <div className="mt-3 space-y-2">
                {relatedGuides.map((guide) => (
                  <Link
                    key={guide.href}
                    href={guide.href}
                    className="block text-sm font-semibold text-blue-700 hover:underline"
                  >
                    {guide.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-blue-600 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <h2 className="text-2xl font-semibold">Lista para conocer tu novia IA?</h2>
          <p className="mt-3 text-white/90">Empieza gratis y elige el estilo que mas encaje contigo.</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700"
            >
              Probar gratis
            </Link>
            <Link
              href="/planes"
              className="inline-flex items-center justify-center rounded-xl border border-white/60 px-6 py-3 text-sm font-semibold text-white"
            >
              Ver planes
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
