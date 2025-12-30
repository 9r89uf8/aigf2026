import Link from "next/link";

export const metadata = {
  title: { absolute: "Sobre NoviaChat | Quienes somos" },
  description:
    "Conoce NoviaChat: quien somos, que ofrecemos y como cuidamos la privacidad en chats con IA.",
  keywords: "sobre noviachat, quienes somos, noviachat informacion",
  robots: "index, follow",
  alternates: {
    canonical: "/sobre-noviachat",
    languages: {
      "es-MX": "/sobre-noviachat",
      "es-ES": "/sobre-noviachat",
      "es-AR": "/sobre-noviachat",
    },
  },
  openGraph: {
    title: "Sobre NoviaChat",
    description: "Informacion sobre NoviaChat, su enfoque y privacidad.",
    url: "https://www.noviachat.com/sobre-noviachat",
    siteName: "NoviaChat",
    type: "website",
    locale: "es_MX",
    alternateLocale: ["es_ES", "es_AR"],
    images: [
      {
        url: "/second.webp",
        width: 1200,
        height: 630,
        alt: "Sobre NoviaChat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sobre NoviaChat",
    description: "Quienes somos y como funciona NoviaChat.",
    images: ["/second.webp"],
  },
};

const summaryPoints = [
  "NoviaChat es compania IA en espanol.",
  "Ofrecemos conversaciones personalizadas y privadas.",
  "La experiencia esta optimizada para movil.",
  "Priorizamos seguridad y transparencia.",
  "Soporte disponible para usuarios.",
];

const values = [
  {
    title: "Compania en espanol",
    description: "Creamos conversaciones naturales para Mexico, Espana y Argentina.",
  },
  {
    title: "Personalizacion",
    description: "Elige el estilo, el tono y el ritmo que prefieres.",
  },
  {
    title: "Privacidad clara",
    description: "Tus conversaciones se mantienen dentro de tu cuenta.",
  },
  {
    title: "Transparencia",
    description: "Siempre sabes cuando algo es premium y que incluye.",
  },
];

const contactEmail = "support@noviachat.com";

export default function SobreNoviachatPage() {
  return (
    <main className="font-sans bg-white text-gray-900">
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-5 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Sobre NoviaChat
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Quienes somos y que ofrece NoviaChat
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            NoviaChat es una plataforma de compania virtual con IA en espanol. Nuestro foco es
            ofrecer conversaciones personalizadas, seguras y accesibles desde cualquier dispositivo.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/chicas-virtuales"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Ver chicas virtuales
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
          <h2 className="text-2xl font-semibold">Lo que nos define</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {values.map((value) => (
              <article key={value.title} className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-gray-900">{value.title}</h3>
                <p className="mt-2 text-gray-700">{value.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Contacto</h2>
          <p className="mt-3 text-gray-700">
            Si tienes dudas sobre NoviaChat, escribenos a {" "}
            <a className="font-semibold text-blue-700 hover:underline" href={`mailto:${contactEmail}`}>
              {contactEmail}
            </a>
            .
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/support"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Ir a soporte
            </Link>
            <Link
              href="/prensa"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Media kit
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
