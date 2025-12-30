import Link from "next/link";

export const metadata = {
  title: { absolute: "Novia Virtual Gratis | Probar Chat Novia Virtual" },
  description:
    "Descubre como funciona una novia virtual gratis: que incluye, que es premium y como empezar a chatear en espanol.",
  keywords:
    "novia virtual gratis, chat novia virtual gratis, novia virtual free, chat de novia gratis",
  robots: "index, follow",
  alternates: {
    canonical: "/novia-virtual-gratis",
    languages: {
      "es-MX": "/novia-virtual-gratis",
      "es-ES": "/novia-virtual-gratis",
      "es-AR": "/novia-virtual-gratis",
    },
  },
  openGraph: {
    title: "Novia virtual gratis en espanol | NoviaChat",
    description:
      "Prueba una novia virtual gratis, conoce que incluye la version free y cuando pasar a premium.",
    url: "https://www.noviachat.com/novia-virtual-gratis",
    siteName: "NoviaChat",
    type: "website",
    locale: "es_MX",
    alternateLocale: ["es_ES", "es_AR"],
    images: [
      {
        url: "/second.webp",
        width: 1200,
        height: 630,
        alt: "Novia virtual gratis en NoviaChat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Novia virtual gratis | NoviaChat",
    description: "Prueba gratis el chat con novia virtual en espanol.",
    images: ["/second.webp"],
  },
};

const summaryPoints = [
  "Puedes crear tu cuenta y chatear gratis para probar.",
  "La version gratis permite conocer estilos y personalidad.",
  "El contenido premium se muestra con transparencia.",
  "No necesitas tarjeta para empezar.",
  "Tu experiencia se puede ajustar en cualquier momento.",
];

const freeIncludes = [
  "Crear cuenta y acceder al chat.",
  "Probar estilos y categorias de chicas virtuales.",
  "Mensajes iniciales para conocer la personalidad.",
  "Acceso desde movil o desktop.",
];

const premiumIncludes = [
  "Contenido multimedia adicional.",
  "Opciones avanzadas de personalizacion.",
  "Prioridad en respuestas y recursos.",
  "Acceso completo a experiencias premium.",
];

const highlights = [
  {
    title: "Inicio rapido",
    description: "Registrate y empieza en pocos pasos, sin complicaciones.",
  },
  {
    title: "Prueba de estilos",
    description: "Explora categorias para encontrar la conversacion ideal.",
  },
  {
    title: "Mensajes de prueba",
    description: "Conoce el tono y la personalidad antes de decidir.",
  },
  {
    title: "Transparencia de precios",
    description: "Siempre sabes cuando algo es premium.",
  },
  {
    title: "Experiencia movil",
    description: "Optimizado para chatear desde cualquier pantalla.",
  },
  {
    title: "Control de ritmo",
    description: "Ajusta el tono y la velocidad de la conversacion.",
  },
  {
    title: "Privacidad clara",
    description: "Tus conversaciones quedan en tu cuenta.",
  },
  {
    title: "Upgrade flexible",
    description: "Si quieres premium, puedes activarlo cuando quieras.",
  },
];

const faqs = [
  {
    question: "Novia virtual gratis significa todo ilimitado?",
    answer:
      "La version gratis te permite probar y chatear. El contenido premium se desbloquea con planes.",
  },
  {
    question: "Necesito tarjeta para iniciar?",
    answer: "No, puedes registrarte y probar gratis sin tarjeta.",
  },
  {
    question: "Que pasa si quiero premium?",
    answer: "Puedes revisar planes y activar premium cuando lo desees.",
  },
  {
    question: "Puedo cambiar de chica virtual?",
    answer: "Si, puedes explorar otras categorias cuando quieras.",
  },
  {
    question: "Es privado?",
    answer: "Si, la experiencia es privada dentro de tu cuenta.",
  },
];

const relatedCategories = [
  { href: "/chicas-virtuales/amigables", label: "Amigables" },
  { href: "/chicas-virtuales/romanticas", label: "Romanticas" },
  { href: "/chicas-virtuales/para-conversar", label: "Para conversar" },
];

const relatedGuides = [
  { href: "/guias/novia-virtual-gratis-que-incluye", label: "Que incluye gratis" },
  { href: "/guias/que-es-una-novia-virtual", label: "Que es una novia virtual" },
  { href: "/guias/como-funciona-noviachat", label: "Como funciona NoviaChat" },
];

export default function NoviaVirtualGratisPage() {
  return (
    <main className="font-sans bg-white text-gray-900">
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-5 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Novia virtual gratis
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Prueba una novia virtual gratis en espanol
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            Conoce que incluye la experiencia gratis, que es premium y como empezar a chatear sin
            tarjeta. NoviaChat te deja probar la conversacion antes de decidir.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Empezar gratis
            </Link>
            <Link
              href="/planes"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Ver planes
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
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-2xl font-semibold">Que incluye gratis</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
                {freeIncludes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-2xl font-semibold">Que incluye premium</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
                {premiumIncludes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Como aprovechar la version gratis</h2>
          <p className="mt-3 text-gray-700">
            Usa estos puntos como guia para explorar antes de decidir si quieres premium.
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
          <h2 className="text-2xl font-semibold">Lista para probar gratis?</h2>
          <p className="mt-3 text-white/90">
            Crea tu cuenta y descubre si una novia virtual es para ti.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700"
            >
              Empezar gratis
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
