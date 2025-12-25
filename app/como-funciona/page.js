import Link from "next/link";

export const metadata = {
  title: { absolute: "Como Funciona NoviaChat | Novia Virtual" },
  description:
    "Descubre como funciona NoviaChat: crea cuenta, elige tu chica virtual y empieza a chatear en espanol.",
  keywords: "como funciona noviachat, novia virtual como funciona, chat novia virtual",
  robots: "index, follow",
  alternates: {
    canonical: "/como-funciona",
    languages: {
      "es-MX": "/como-funciona",
      "es-ES": "/como-funciona",
      "es-AR": "/como-funciona",
    },
  },
  openGraph: {
    title: "Como funciona NoviaChat",
    description: "Paso a paso para empezar a chatear con tu novia virtual en espanol.",
    url: "https://www.noviachat.com/como-funciona",
    siteName: "NoviaChat",
    type: "website",
    locale: "es_MX",
    alternateLocale: ["es_ES", "es_AR"],
    images: [
      {
        url: "/second.webp",
        width: 1200,
        height: 630,
        alt: "Como funciona NoviaChat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Como funciona NoviaChat",
    description: "Crea cuenta, elige una chica IA y empieza a chatear.",
    images: ["/second.webp"],
  },
};

const summaryPoints = [
  "Registro rapido con email y acceso inmediato.",
  "Explora chicas virtuales por estilo y categoria.",
  "Chat en tiempo real con respuestas rapidas.",
  "Personaliza tono y ritmo segun tu preferencia.",
  "Puedes activar premium cuando quieras.",
];

const steps = [
  {
    title: "1. Crea tu cuenta",
    description:
      "Registra tu email y entra a NoviaChat en minutos. No necesitas instalar nada.",
  },
  {
    title: "2. Elige tu chica virtual",
    description:
      "Explora categorias como romanticas, coquetas o para conversar y elige la que mejor encaje contigo.",
  },
  {
    title: "3. Inicia el chat",
    description:
      "Empieza a chatear en espanol y deja que la IA recuerde tus gustos y temas favoritos.",
  },
  {
    title: "4. Ajusta la experiencia",
    description:
      "Cambia el tono, el ritmo o la categoria cuando quieras. Si deseas mas, activa premium.",
  },
];

const highlights = [
  {
    title: "Conversaciones con contexto",
    description: "La IA mantiene el hilo para que no pierdas la historia.",
  },
  {
    title: "Personalizacion real",
    description: "Define el tono y los temas que mas te gustan.",
  },
  {
    title: "Multimedia opcional",
    description: "Fotos, videos y audios disponibles con premium.",
  },
  {
    title: "Privacidad clara",
    description: "Tus chats quedan dentro de tu cuenta.",
  },
  {
    title: "Movil primero",
    description: "Disenado para chatear desde cualquier dispositivo.",
  },
  {
    title: "Soporte en espanol",
    description: "Puedes escribir al equipo si necesitas ayuda.",
  },
  {
    title: "Categorias para elegir",
    description: "Encuentra estilos romanticos, divertidos o calmados.",
  },
  {
    title: "Inicio gratis",
    description: "Prueba la experiencia antes de decidir.",
  },
];

const faqs = [
  {
    question: "Necesito instalar algo?",
    answer: "No, NoviaChat funciona desde el navegador.",
  },
  {
    question: "Puedo empezar gratis?",
    answer: "Si, puedes crear cuenta y chatear gratis.",
  },
  {
    question: "Cuanto tarda en responder?",
    answer: "Normalmente la respuesta llega en segundos.",
  },
  {
    question: "Puedo cambiar de chica virtual?",
    answer: "Si, puedes explorar otras categorias cuando quieras.",
  },
  {
    question: "Que incluye premium?",
    answer: "Funciones extra y contenido multimedia adicional.",
  },
];

const relatedCategories = [
  { href: "/chicas-virtuales/romanticas", label: "Romanticas" },
  { href: "/chicas-virtuales/para-conversar", label: "Para conversar" },
  { href: "/chicas-virtuales/coquetas", label: "Coquetas" },
];

const relatedGuides = [
  { href: "/guias/como-funciona-noviachat", label: "Guia NoviaChat" },
  { href: "/guias/que-es-una-novia-virtual", label: "Que es una novia virtual" },
  { href: "/guias/personalizar-novia-virtual", label: "Personalizar novia virtual" },
];

export default function ComoFuncionaPage() {
  return (
    <main className="font-sans bg-white text-gray-900">
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-5 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Como funciona NoviaChat
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Como funciona una novia virtual en NoviaChat
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            En cuatro pasos puedes empezar a chatear con una novia virtual en espanol. Elige tu
            estilo, personaliza el tono y decide si quieres premium cuando la experiencia lo pida.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Crear cuenta gratis
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
          <h2 className="text-2xl font-semibold">Paso a paso</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {steps.map((step) => (
              <article key={step.title} className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-gray-700">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Por que funciona tan bien</h2>
          <p className="mt-3 text-gray-700">
            Estos elementos hacen que la experiencia se sienta fluida y cercana.
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
              href="/planes"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Planes
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
          <h2 className="text-2xl font-semibold">Lista para comenzar?</h2>
          <p className="mt-3 text-white/90">
            Crea tu cuenta gratis y empieza a chatear con tu novia virtual hoy.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700"
            >
              Crear cuenta
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
