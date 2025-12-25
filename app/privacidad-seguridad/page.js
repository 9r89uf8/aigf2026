import Link from "next/link";

export const metadata = {
  title: { absolute: "Privacidad y Seguridad | NoviaChat" },
  description:
    "Conoce como NoviaChat protege tu privacidad: datos, seguridad y buenas practicas para chatear con IA.",
  keywords: "privacidad noviachat, seguridad chat ia, privacidad novia virtual",
  robots: "index, follow",
  alternates: {
    canonical: "/privacidad-seguridad",
    languages: {
      "es-MX": "/privacidad-seguridad",
      "es-ES": "/privacidad-seguridad",
      "es-AR": "/privacidad-seguridad",
    },
  },
  openGraph: {
    title: "Privacidad y seguridad en NoviaChat",
    description:
      "Buenas practicas y protecciones de privacidad para chats con novia virtual IA.",
    url: "https://www.noviachat.com/privacidad-seguridad",
    siteName: "NoviaChat",
    type: "website",
    locale: "es_MX",
    alternateLocale: ["es_ES", "es_AR"],
    images: [
      {
        url: "/second.webp",
        width: 1200,
        height: 630,
        alt: "Privacidad y seguridad NoviaChat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacidad y seguridad | NoviaChat",
    description: "Protegemos tus datos y conversaciones en NoviaChat.",
    images: ["/second.webp"],
  },
};

const summaryPoints = [
  "Tus conversaciones se mantienen dentro de tu cuenta.",
  "Usamos buenas practicas para proteger el acceso.",
  "La privacidad es parte central del producto.",
  "Puedes contactar soporte si tienes dudas.",
  "Evita compartir datos sensibles en el chat.",
];

const protections = [
  "Acceso seguro con autenticacion confiable.",
  "Controles para proteger sesiones y dispositivos.",
  "Infraestructura optimizada para proteger datos en transito.",
  "Buenas practicas de almacenamiento y permisos.",
];

const userTips = [
  "Usa una contrasena unica.",
  "No compartas datos financieros ni documentos.",
  "Cierra sesion si compartes dispositivo.",
  "Actualiza tu correo si cambias de cuenta.",
];

const faqs = [
  {
    question: "Mis conversaciones son privadas?",
    answer: "Si, las conversaciones se mantienen dentro de tu cuenta.",
  },
  {
    question: "Que datos recopilan?",
    answer: "Los necesarios para operar el servicio y dar soporte.",
  },
  {
    question: "Puedo pedir eliminacion de datos?",
    answer: "Si, puedes escribir al soporte para solicitarlo.",
  },
  {
    question: "NoviaChat comparte mis datos?",
    answer: "No vendemos datos y solo usamos lo necesario para operar.",
  },
  {
    question: "Donde veo la politica completa?",
    answer: "Puedes revisar la politica de privacidad completa en la pagina legal.",
  },
];

const relatedCategories = [
  { href: "/chicas-virtuales/amigables", label: "Amigables" },
  { href: "/chicas-virtuales/para-conversar", label: "Para conversar" },
  { href: "/chicas-virtuales/romanticas", label: "Romanticas" },
];

const relatedGuides = [
  { href: "/guias/seguridad-privacidad-chats-ia", label: "Seguridad en chats IA" },
  { href: "/guias/como-funciona-noviachat", label: "Como funciona NoviaChat" },
  { href: "/guias/que-es-una-novia-virtual", label: "Que es una novia virtual" },
];

export default function PrivacidadSeguridadPage() {
  return (
    <main className="font-sans bg-white text-gray-900">
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-5 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Privacidad y seguridad
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Privacidad y seguridad en NoviaChat
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            La privacidad es clave para una experiencia segura. Aqui encuentras un resumen claro de
            como protegemos tus conversaciones y como puedes cuidarte mientras chateas.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/privacy"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Ver politica completa
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
              <h2 className="text-2xl font-semibold">Protecciones principales</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
                {protections.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-2xl font-semibold">Buenas practicas para ti</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
                {userTips.map((item) => (
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
          <h2 className="text-2xl font-semibold">Quieres saber mas?</h2>
          <p className="mt-3 text-white/90">
            Si tienes dudas sobre privacidad o seguridad, nuestro equipo puede ayudarte.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/support"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700"
            >
              Contactar soporte
            </Link>
            <Link
              href="/privacy"
              className="inline-flex items-center justify-center rounded-xl border border-white/60 px-6 py-3 text-sm font-semibold text-white"
            >
              Ver privacidad
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
