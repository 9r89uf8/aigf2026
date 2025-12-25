import Link from "next/link";

export const metadata = {
  title: { absolute: "Planes y Precios | NoviaChat" },
  description:
    "Revisa planes y precios de NoviaChat: que incluye premium, que puedes hacer gratis y como elegir el plan ideal.",
  keywords: "planes noviachat, precios novia virtual, premium novia virtual",
  robots: "index, follow",
  alternates: {
    canonical: "/planes",
    languages: {
      "es-MX": "/planes",
      "es-ES": "/planes",
      "es-AR": "/planes",
    },
  },
  openGraph: {
    title: "Planes y precios | NoviaChat",
    description:
      "Descubre los planes premium y que incluye la experiencia gratis en NoviaChat.",
    url: "https://www.noviachat.com/planes",
    siteName: "NoviaChat",
    type: "website",
    locale: "es_MX",
    alternateLocale: ["es_ES", "es_AR"],
    images: [
      {
        url: "/second.webp",
        width: 1200,
        height: 630,
        alt: "Planes NoviaChat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Planes y precios | NoviaChat",
    description: "Comparar planes premium y comenzar gratis en NoviaChat.",
    images: ["/second.webp"],
  },
};

const summaryPoints = [
  "Puedes empezar gratis y probar el chat.",
  "Los planes premium desbloquean contenido extra.",
  "Precios claros y sin sorpresas.",
  "Puedes elegir el plan segun tu uso.",
  "El acceso premium se activa rapido.",
];

const planBenefits = [
  "Acceso completo a contenido multimedia.",
  "Prioridad en respuestas y recursos.",
  "Opciones avanzadas de personalizacion.",
  "Soporte preferente en caso de duda.",
];

const freeBenefits = [
  "Crear cuenta y chatear para probar.",
  "Explorar categorias y estilos.",
  "Conocer la personalidad antes de decidir.",
  "Acceso desde movil o desktop.",
];

const faqs = [
  {
    question: "Puedo empezar gratis?",
    answer: "Si, puedes probar NoviaChat gratis antes de elegir un plan.",
  },
  {
    question: "Que desbloquea premium?",
    answer: "Funciones avanzadas y contenido multimedia adicional.",
  },
  {
    question: "Hay planes por pais?",
    answer: "Los precios se muestran segun la moneda disponible.",
  },
  {
    question: "Puedo cancelar cuando quiera?",
    answer: "Si, puedes dejar el plan cuando ya no lo necesites.",
  },
  {
    question: "Donde veo los precios exactos?",
    answer: "En la pagina de planes con precios actualizados.",
  },
];

const relatedCategories = [
  { href: "/chicas-virtuales/romanticas", label: "Romanticas" },
  { href: "/chicas-virtuales/coquetas", label: "Coquetas" },
  { href: "/chicas-virtuales/amigables", label: "Amigables" },
];

const relatedGuides = [
  { href: "/guias/novia-virtual-gratis-que-incluye", label: "Que incluye gratis" },
  { href: "/guias/como-funciona-noviachat", label: "Como funciona NoviaChat" },
  { href: "/guias/seguridad-privacidad-chats-ia", label: "Seguridad y privacidad" },
];

export default function PlanesPage() {
  return (
    <main className="font-sans bg-white text-gray-900">
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-5 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Planes y precios
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Planes premium para tu novia virtual
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            Puedes empezar gratis y pasar a premium cuando quieras mas contenido y opciones.
            Revisa los planes actualizados y elige el que mejor se adapte a tu uso.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/plans"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Ver precios actuales
            </Link>
            <Link
              href="/novia-virtual-gratis"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Que incluye gratis
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
              <h2 className="text-2xl font-semibold">Lo que incluye premium</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
                {planBenefits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-2xl font-semibold">Lo que puedes hacer gratis</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
                {freeBenefits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
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
              href="/novia-virtual"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Novia virtual
            </Link>
            <Link
              href="/chat-novia-virtual"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Chat novia virtual
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
          <h2 className="text-2xl font-semibold">Listo para elegir tu plan?</h2>
          <p className="mt-3 text-white/90">
            Revisa los precios actualizados y decide cuando activar premium.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/plans"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700"
            >
              Ver precios
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl border border-white/60 px-6 py-3 text-sm font-semibold text-white"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
