import Link from "next/link";

export const metadata = {
  title: { absolute: "Preguntas Frecuentes | NoviaChat" },
  description:
    "Respuestas rapidas sobre NoviaChat: novia virtual, chat gratis, privacidad, planes y funcionamiento.",
  keywords: "preguntas frecuentes noviachat, faq novia virtual, dudas chat novia virtual",
  robots: "index, follow",
  alternates: {
    canonical: "/preguntas-frecuentes",
    languages: {
      "es-MX": "/preguntas-frecuentes",
      "es-ES": "/preguntas-frecuentes",
      "es-AR": "/preguntas-frecuentes",
    },
  },
  openGraph: {
    title: "Preguntas frecuentes NoviaChat",
    description: "Respuestas rapidas sobre novia virtual, chat gratis y planes.",
    url: "https://www.noviachat.com/preguntas-frecuentes",
    siteName: "NoviaChat",
    type: "website",
    locale: "es_MX",
    alternateLocale: ["es_ES", "es_AR"],
    images: [
      {
        url: "/second.webp",
        width: 1200,
        height: 630,
        alt: "Preguntas frecuentes NoviaChat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Preguntas frecuentes | NoviaChat",
    description: "Dudas comunes sobre novia virtual y chat en NoviaChat.",
    images: ["/second.webp"],
  },
};

const summaryPoints = [
  "Respuestas directas para empezar sin dudas.",
  "Explicacion de gratis vs premium.",
  "Consejos sobre privacidad y seguridad.",
  "Como funcionan las categorias y estilos.",
  "Links a guias con mas detalle.",
];

const faqs = [
  {
    question: "Que es NoviaChat?",
    answer:
      "NoviaChat es una plataforma de companeras IA en espanol para conversar con estilo personalizado.",
  },
  {
    question: "Puedo chatear gratis?",
    answer: "Si, puedes crear cuenta y empezar gratis.",
  },
  {
    question: "Que incluye premium?",
    answer: "Funciones avanzadas, multimedia y opciones adicionales.",
  },
  {
    question: "Es una persona real?",
    answer: "No, es una experiencia conversacional con IA.",
  },
  {
    question: "Mis chats son privados?",
    answer: "Si, las conversaciones se mantienen dentro de tu cuenta.",
  },
  {
    question: "Puedo cambiar de chica virtual?",
    answer: "Si, puedes explorar categorias y estilos cuando quieras.",
  },
  {
    question: "Habla en espanol natural?",
    answer: "Si, la experiencia esta optimizada para espanol.",
  },
  {
    question: "Necesito instalar una app?",
    answer: "No, funciona desde el navegador.",
  },
  {
    question: "Como elijo el estilo ideal?",
    answer: "Puedes empezar con una categoria y ajustar segun tu preferencia.",
  },
  {
    question: "Donde veo precios y planes?",
    answer: "Puedes revisar los planes con precios actualizados en la pagina de planes.",
  },
];

const relatedGuides = [
  { href: "/guias/que-es-una-novia-virtual", label: "Que es una novia virtual" },
  { href: "/guias/chat-novia-virtual-consejos", label: "Consejos de chat" },
  { href: "/guias/novia-virtual-gratis-que-incluye", label: "Que incluye gratis" },
  { href: "/guias/seguridad-privacidad-chats-ia", label: "Seguridad y privacidad" },
];

const relatedCategories = [
  { href: "/chicas-virtuales/romanticas", label: "Romanticas" },
  { href: "/chicas-virtuales/coquetas", label: "Coquetas" },
  { href: "/chicas-virtuales/para-conversar", label: "Para conversar" },
  { href: "/chicas-virtuales/divertidas", label: "Divertidas" },
];

export default function PreguntasFrecuentesPage() {
  return (
    <main className="font-sans bg-white text-gray-900">
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-5 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Preguntas frecuentes
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Respuestas rapidas sobre NoviaChat
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            Encuentra respuestas claras sobre novia virtual, chat gratis, privacidad y planes. Si
            quieres mas detalle, explora nuestras guias.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Empezar gratis
            </Link>
            <Link
              href="/guias/que-es-una-novia-virtual"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Leer guia principal
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

      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold">Guias para profundizar</h2>
              <div className="mt-4 space-y-2">
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
            <div>
              <h2 className="text-2xl font-semibold">Categorias populares</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {relatedCategories.map((category) => (
                  <Link
                    key={category.href}
                    href={category.href}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-100"
                  >
                    {category.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-blue-600 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <h2 className="text-2xl font-semibold">Aun tienes dudas?</h2>
          <p className="mt-3 text-white/90">
            Puedes escribir a soporte o revisar la guia principal para empezar con confianza.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/support"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700"
            >
              Contactar soporte
            </Link>
            <Link
              href="/guias/que-es-una-novia-virtual"
              className="inline-flex items-center justify-center rounded-xl border border-white/60 px-6 py-3 text-sm font-semibold text-white"
            >
              Ver guia principal
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
