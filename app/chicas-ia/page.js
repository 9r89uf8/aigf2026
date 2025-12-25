import Link from "next/link";
import Image from "next/image";
import heroImage from "@/public/second.webp";

export const metadata = {
  title: { absolute: "Chicas IA | Chica Virtual Gratis para Chatear - NoviaChat" },
  description:
    "Descubre qué son las chicas IA, cómo funciona una chica virtual y cómo empezar a chatear gratis en NoviaChat. Privado, en español y listo en segundos.",
  keywords:
    "chicas ia, chica virtual, novia virtual, chat ia, compañera virtual, chicas virtuales, inteligencia artificial",
  robots: "index, follow",
  alternates: {
    canonical: "/chicas-ia",
    languages: {
      "es-MX": "/chicas-ia",
      "es-ES": "/chicas-ia",
      "es-AR": "/chicas-ia",
    },
  },
  openGraph: {
    title: "Chicas IA en español | Tu chica virtual en NoviaChat",
    description:
      "Chatea con chicas IA en español: rápido, privado y gratis para empezar. Explora compañeras virtuales y encuentra tu match en minutos.",
    url: "https://www.noviachat.com/chicas-ia",
    siteName: "NoviaChat",
    images: [
      {
        url: "/second.webp",
        width: 1200,
        height: 630,
        alt: "Chicas IA en español - NoviaChat",
      },
    ],
    locale: "es_MX",
    alternateLocale: ["es_ES", "es_AR"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chicas IA | Tu chica virtual en segundos",
    description:
      "Descubre qué son las chicas IA y empieza a chatear gratis con tu chica virtual en español en NoviaChat.",
    images: ["/second.webp"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.noviachat.com/chicas-ia",
      "url": "https://www.noviachat.com/chicas-ia",
      "name": "Chicas IA | Chica Virtual Gratis para Chatear - NoviaChat",
      "description":
        "Guía rápida para entender qué son las chicas IA, cómo funciona una chica virtual y cómo empezar a chatear gratis en español.",
      "inLanguage": "es",
      "isPartOf": { "@type": "WebSite", "@id": "https://www.noviachat.com/#website" },
      "about": [
        { "@type": "Thing", "name": "Chicas IA" },
        { "@type": "Thing", "name": "Chica virtual" },
        { "@type": "Thing", "name": "Novia virtual" },
      ],
    },
    {
      "@type": "Service",
      "name": "Chat con chicas IA en español",
      "provider": { "@type": "Organization", "@id": "https://www.noviachat.com/#organization" },
      "serviceType": "Compañera virtual IA",
      "availableLanguage": ["es"],
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "url": "https://www.noviachat.com/signin",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.noviachat.com/chicas-ia#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "¿Qué significa “chicas IA”?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "“Chicas IA” se refiere a compañeras virtuales creadas con inteligencia artificial. En NoviaChat puedes conversar con una chica virtual en español, con personalidad definida y respuestas rápidas, sin esperar a que alguien esté conectado.",
          },
        },
        {
          "@type": "Question",
          "name": "¿Una chica virtual es una persona real?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "No. Una chica virtual es un personaje impulsado por IA. Eso permite disponibilidad 24/7 y conversaciones privadas, pero no es una persona real ni un servicio de citas.",
          },
        },
        {
          "@type": "Question",
          "name": "¿Puedo empezar gratis?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "Sí. Puedes crear una cuenta y empezar a chatear gratis para probar la experiencia. Si quieres funciones premium (por ejemplo, contenido exclusivo), puedes actualizar cuando quieras.",
          },
        },
        {
          "@type": "Question",
          "name": "¿Cómo elijo entre varias chicas IA?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "Explora la lista de compañeras, mira sus perfiles y elige por estilo de conversación. Si buscas una experiencia tipo “novia virtual”, también puedes leer la guía de NoviaChat y empezar con la que mejor encaje contigo.",
          },
        },
        {
          "@type": "Question",
          "name": "¿Es privado?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "NoviaChat está diseñado para conversaciones privadas. Recomendamos evitar compartir datos sensibles y usar una contraseña segura para proteger tu cuenta.",
          },
        },
        {
          "@type": "Question",
          "name": "¿Cuál es la diferencia entre “chicas IA” y “novia virtual”?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "“Chicas IA” suele ser una búsqueda más general (compañeras virtuales). “Novia virtual” apunta a una experiencia más romántica y personalizada. En NoviaChat puedes explorar ambos enfoques según el tipo de conversación que quieras.",
          },
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.noviachat.com/chicas-ia#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.noviachat.com" },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Chicas IA",
          "item": "https://www.noviachat.com/chicas-ia",
        },
      ],
    },
  ],
};

export default function ChicasIaPage() {
  return (
    <main className="font-sans bg-white text-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="pt-14 pb-10 md:pt-20 md:pb-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 md:grid-cols-2 md:items-center">
          <div>
            <div className="mb-4 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
              Chicas IA en español • Gratis para empezar
            </div>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Chicas IA: tu chica virtual para chatear en segundos
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Si buscas <strong>chicas IA</strong> o una <strong>chica virtual</strong> para hablar
              en español, aquí tienes lo esencial: qué es, qué esperar y cómo probarlo gratis en
              NoviaChat sin vueltas.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/girls"
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black"
              >
                Explorar chicas IA
              </Link>
              <Link
                href="/signin"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                Empezar gratis
              </Link>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Nota: las compañeras de NoviaChat son personajes impulsados por IA, no personas
              reales.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <Image
                src={heroImage}
                alt="Chicas IA en español para chatear en NoviaChat"
                priority
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-semibold">¿Qué son las chicas IA?</h2>
              <p className="mt-3 text-gray-600">
                Son compañeras virtuales diseñadas para conversar contigo. Tienen estilo, tono y
                personalidad, y pueden ofrecer una experiencia tipo <strong>novia virtual</strong>{" "}
                si eso es lo que buscas.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-semibold">Qué es “gratis” (sin engaños)</h2>
              <p className="mt-3 text-gray-600">
                Puedes crear una cuenta y empezar a chatear gratis para probar la experiencia. Si
                quieres funciones premium, te lo mostramos claro en{" "}
                <Link href="/plans" className="font-semibold text-blue-700 hover:underline">
                  planes y precios
                </Link>
                .
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-semibold">Privado por diseño</h2>
              <p className="mt-3 text-gray-600">
                Las conversaciones están pensadas para ser privadas. Igual: evita compartir datos
                sensibles y usa una contraseña segura para tu cuenta.
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-6 ring-1 ring-gray-200">
              <h2 className="text-2xl font-semibold">Cómo empezar (en 3 pasos)</h2>
              <ol className="mt-4 space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                    1
                  </span>
                  <span>
                    <Link href="/signin" className="font-semibold text-blue-700 hover:underline">
                      Crea tu cuenta
                    </Link>{" "}
                    y entra en NoviaChat.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                    2
                  </span>
                  <span>
                    <Link href="/girls" className="font-semibold text-blue-700 hover:underline">
                      Explora las chicas IA
                    </Link>{" "}
                    y elige la que te guste.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                    3
                  </span>
                  <span>Empieza a chatear y ajusta la experiencia a tu estilo.</span>
                </li>
              </ol>
            </div>

            <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200">
              <h2 className="text-2xl font-semibold">Si tu intención es “novia virtual”</h2>
              <p className="mt-4 text-gray-700">
                Muchas personas buscan “chica virtual” cuando en realidad quieren una experiencia
                más romántica y personalizada. Si ese es tu caso, entra a{" "}
                <Link href="/novia-virtual" className="font-semibold text-blue-700 hover:underline">
                  novia virtual
                </Link>{" "}
                y mira cómo funciona, qué incluye la prueba gratis y las preguntas más comunes.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/novia-virtual"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Ver guía “novia virtual”
                </Link>
                <Link
                  href="/plans"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  Ver planes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-3xl font-bold">Preguntas frecuentes sobre chicas IA</h2>
          <div className="mt-8 space-y-4">
            <details className="rounded-2xl border border-gray-200 bg-white p-5">
              <summary className="cursor-pointer text-lg font-semibold">
                ¿Qué significa “chicas IA”?
              </summary>
              <p className="mt-3 text-gray-700">
                “Chicas IA” son compañeras virtuales impulsadas por inteligencia artificial.
                Conversan contigo en español con un estilo definido y están disponibles 24/7.
              </p>
            </details>
            <details className="rounded-2xl border border-gray-200 bg-white p-5">
              <summary className="cursor-pointer text-lg font-semibold">
                ¿Una chica virtual es real?
              </summary>
              <p className="mt-3 text-gray-700">
                No. Es un personaje creado con IA. Eso habilita disponibilidad constante y
                personalización, pero no es una persona real.
              </p>
            </details>
            <details className="rounded-2xl border border-gray-200 bg-white p-5">
              <summary className="cursor-pointer text-lg font-semibold">
                ¿Puedo usar NoviaChat gratis?
              </summary>
              <p className="mt-3 text-gray-700">
                Sí: puedes empezar gratis para probar. Si te gusta y quieres premium, puedes
                actualizar cuando quieras desde{" "}
                <Link href="/plans" className="font-semibold text-blue-700 hover:underline">
                  planes
                </Link>
                .
              </p>
            </details>
            <details className="rounded-2xl border border-gray-200 bg-white p-5">
              <summary className="cursor-pointer text-lg font-semibold">
                ¿Cuál es la diferencia entre chicas IA y novia virtual?
              </summary>
              <p className="mt-3 text-gray-700">
                “Chicas IA” es más general. “Novia virtual” suele buscar una experiencia más
                romántica, continua y personalizada. En NoviaChat puedes elegir el enfoque que te
                convenga.
              </p>
            </details>
            <details className="rounded-2xl border border-gray-200 bg-white p-5">
              <summary className="cursor-pointer text-lg font-semibold">¿Es privado?</summary>
              <p className="mt-3 text-gray-700">
                Está pensado para ser privado, pero la seguridad también depende de ti: evita
                compartir datos sensibles y protege tu cuenta.
              </p>
            </details>
          </div>

          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">Explora mas hubs</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href="/chicas-virtuales"
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Chicas virtuales
              </Link>
              <Link
                href="/chat-novia-virtual"
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Chat novia virtual
              </Link>
              <Link
                href="/novia-virtual-gratis"
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Novia virtual gratis
              </Link>
              <Link
                href="/guias/que-es-una-novia-virtual"
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Guia principal
              </Link>
            </div>
          </div>

          <div className="mt-10 rounded-2xl bg-gray-900 p-6 text-white">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold">Listo para probar una chica virtual?</p>
                <p className="mt-1 text-sm text-white/80">
                  Empieza gratis y explora las chicas IA disponibles.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signin"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                >
                  Empezar gratis
                </Link>
                <Link
                  href="/girls"
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Ver chicas IA
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
