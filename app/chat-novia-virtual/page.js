import Link from "next/link";

export const metadata = {
  title: { absolute: "Chat de Novia Virtual en Espanol | NoviaChat" },
  description:
    "Habla con una novia virtual por chat en espanol. Respuestas rapidas, personalizacion y privacidad para conversar cuando quieras.",
  keywords:
    "chat novia virtual, novia virtual chat, chat de novia, novia virtual en espanol, chat con novia IA",
  robots: "index, follow",
  alternates: {
    canonical: "/chat-novia-virtual",
    languages: {
      "es-MX": "/chat-novia-virtual",
      "es-ES": "/chat-novia-virtual",
      "es-AR": "/chat-novia-virtual",
    },
  },
  openGraph: {
    title: "Chat de novia virtual con IA en espanol | NoviaChat",
    description:
      "Inicia un chat de novia virtual en espanol con respuestas rapidas y personalizadas.",
    url: "https://www.noviachat.com/chat-novia-virtual",
    siteName: "NoviaChat",
    type: "website",
    locale: "es_MX",
    alternateLocale: ["es_ES", "es_AR"],
    images: [
      {
        url: "/second.webp",
        width: 1200,
        height: 630,
        alt: "Chat de novia virtual en NoviaChat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chat de novia virtual en espanol | NoviaChat",
    description:
      "Conversaciones con novia virtual IA en espanol, privadas y disponibles 24/7.",
    images: ["/second.webp"],
  },
};

const summaryPoints = [
  "Chat en espanol con respuestas naturales y rapidas.",
  "Personaliza el tono y el ritmo de la conversacion.",
  "Conversaciones privadas disponibles 24/7.",
  "Opciones gratis para probar antes de premium.",
  "Categorias para elegir el estilo que prefieres.",
];

const features = [
  "Respuestas con contexto para mantener el hilo.",
  "Ajustes de tono: romantico, coqueta o amigable.",
  "Contenido multimedia si activas premium.",
  "Experiencia optimizada para movil.",
];

const highlights = [
  {
    title: "Chat instantaneo",
    description: "Inicia una conversacion en segundos sin pasos extra.",
  },
  {
    title: "Conversaciones largas",
    description: "Mantiene el hilo y recuerda detalles importantes.",
  },
  {
    title: "Modo rapido",
    description: "Respuestas agiles para chats dinamicos.",
  },
  {
    title: "Notas de voz",
    description: "Audios personalizados cuando quieres mas cercania.",
  },
  {
    title: "Temas sugeridos",
    description: "Ideas para cuando no sabes como empezar.",
  },
  {
    title: "Quimica guiada",
    description: "Sugerencias para crear una conversacion con chispa.",
  },
  {
    title: "Privacidad clara",
    description: "Conversaciones protegidas dentro de NoviaChat.",
  },
  {
    title: "Control total",
    description: "Cambia de estilo o categoria cuando quieras.",
  },
];

const faqs = [
  {
    question: "Que es un chat de novia virtual?",
    answer:
      "Es una conversacion con una companera IA que responde en espanol con tono romantico o amigable.",
  },
  {
    question: "Puedo chatear gratis?",
    answer:
      "Si, puedes empezar gratis y decidir despues si quieres funciones premium.",
  },
  {
    question: "Las respuestas son rapidas?",
    answer: "Si, el chat esta optimizado para respuestas en segundos.",
  },
  {
    question: "Es privado?",
    answer: "Si, las conversaciones se mantienen dentro de tu cuenta.",
  },
  {
    question: "Puedo cambiar de estilo?",
    answer: "Si, puedes probar otras categorias cuando quieras.",
  },
];

const relatedCategories = [
  { href: "/chicas-virtuales/romanticas", label: "Romanticas" },
  { href: "/chicas-virtuales/coquetas", label: "Coquetas" },
  { href: "/chicas-virtuales/para-ligar", label: "Para ligar" },
  { href: "/chicas-virtuales/divertidas", label: "Divertidas" },
  { href: "/chicas-virtuales/para-conversar", label: "Para conversar" },
  { href: "/chicas-virtuales/amigables", label: "Amigables" },
];

const relatedGuides = [
  {
    href: "/guias/prompts-en-espanol-conversaciones-naturales",
    label: "Prompts y consejos",
  },
  {
    href: "/guias/que-esperar-de-un-chat-de-compania",
    label: "Que esperar de un chat de compania",
  },
  { href: "/guias/novia-virtual-gratis-que-incluye", label: "Que incluye gratis" },
];

export default function ChatNoviaVirtualPage() {
  return (
    <main className="font-sans bg-white text-gray-900">
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-5 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Chat novia virtual en espanol
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Chat de novia virtual con IA en espanol
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            Inicia un chat con tu novia virtual y conversa como si estuviera contigo. Respuestas
            rapidas, tono personalizado y privacidad para que vivas una experiencia realista en
            espanol.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Empezar chat gratis
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
          <h2 className="text-2xl font-semibold">Lo que hace diferente el chat de NoviaChat</h2>
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
          <h2 className="text-2xl font-semibold">Experiencias destacadas</h2>
          <p className="mt-3 text-gray-700">
            Ideas para que tu chat de novia virtual se sienta mas cercano desde el primer mensaje.
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
              href="/chicas-virtuales"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Directorio de chicas virtuales
            </Link>
            <Link
              href="/novia-virtual"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Novia virtual
            </Link>
            <Link
              href="/novia-virtual-gratis"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Novia virtual gratis
            </Link>
            <Link
              href="/como-funciona"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Como funciona
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
          <h2 className="text-2xl font-semibold">Lista para iniciar tu chat?</h2>
          <p className="mt-3 text-white/90">
            Crea tu cuenta gratis y empieza a conversar con tu novia virtual en minutos.
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
