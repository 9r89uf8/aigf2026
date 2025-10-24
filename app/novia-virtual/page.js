import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Novia Virtual Realista en Español | NoviaChat",
  description: "Descubre la novia virtual que siempre responde en español con mensajes, fotos, videos y audio. NoviaChat te conecta con compañeras IA hiperrealistas pensadas para México, España y Argentina.",
  keywords: "novia virtual, novia virtual ia, novia virtual en español, compañera virtual, chat novia virtual, inteligencia artificial novia",
  robots: "index, follow",
  alternates: {
    canonical: "https://noviachat.com/novia-virtual",
    languages: {
      "es-MX": "https://noviachat.com/novia-virtual",
      "es-ES": "https://noviachat.com/novia-virtual",
      "es-AR": "https://noviachat.com/novia-virtual",
    },
  },
  openGraph: {
    title: "Novia Virtual Realista en Español | NoviaChat",
    description: "Vive una relación con tu novia virtual IA. Conversaciones privadas con texto, imágenes, videos y audio en español.",
    url: "https://noviachat.com/novia-virtual",
    siteName: "NoviaChat",
    locale: "es_MX",
    alternateLocale: ["es_ES", "es_AR"],
    type: "website",
    images: [
      {
        url: "https://noviachat.com/second.jpg",
        width: 1200,
        height: 630,
        alt: "Novia virtual realista en NoviaChat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tu novia virtual en español siempre disponible",
    description: "NoviaChat ofrece compañeras IA que hablan español perfecto y envían texto, imágenes, videos y audio.",
    images: ["https://noviachat.com/second.jpg"],
  },
  authors: [{ name: "NoviaChat" }],
  creator: "NoviaChat",
  publisher: "NoviaChat",
  other: {
    "geo.region": "MX;ES;AR",
    "geo.placename": "México;España;Argentina",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://noviachat.com/novia-virtual",
      "url": "https://noviachat.com/novia-virtual",
      "name": "Novia Virtual Realista en Español | NoviaChat",
      "description": "Explora la experiencia completa de tener una novia virtual IA en español con respuestas privadas en texto, imágenes, videos y audio.",
      "inLanguage": "es",
      "isPartOf": {
        "@type": "WebSite",
        "@id": "https://noviachat.com/#website",
      },
      "about": {
        "@type": "Thing",
        "name": "Novia virtual IA",
      },
    },
    {
      "@type": "Service",
      "name": "Novia virtual IA en español",
      "provider": {
        "@type": "Organization",
        "name": "NoviaChat",
        "url": "https://noviachat.com",
      },
      "serviceType": "Compañera virtual IA",
      "areaServed": [
        { "@type": "Country", "name": "México" },
        { "@type": "Country", "name": "España" },
        { "@type": "Country", "name": "Argentina" },
      ],
      "availableLanguage": ["es"],
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "url": "https://noviachat.com/signin",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://noviachat.com/novia-virtual#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "¿Qué es una novia virtual en NoviaChat?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Es una compañera IA 100% en español que responde con mensajes, fotos, videos y audio privados. Se adapta a tus gustos y mantiene una conversación continua sin importar la hora.",
          },
        },
        {
          "@type": "Question",
          "name": "¿Cómo empiezo con mi novia virtual?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Solo crea tu cuenta gratuita, elige a la chica IA que mejor combina contigo y comienza a chatear. Puedes desbloquear contenido exclusivo cuando quieras.",
          },
        },
        {
          "@type": "Question",
          "name": "¿La experiencia es privada y segura?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sí. Todas las conversaciones, archivos y notas de voz se procesan de forma privada y seguimos mejores prácticas de seguridad para proteger tu identidad.",
          },
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://noviachat.com/novia-virtual#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Inicio",
          "item": "https://noviachat.com",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Novia virtual",
          "item": "https://noviachat.com/novia-virtual",
        },
      ],
    },
  ],
};

export default function NoviaVirtualPage() {
  return (
    <main className="font-sans bg-white text-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="pt-16 pb-12 md:py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 md:flex-row md:items-center">
          <div className="w-full md:w-1/2">
            <div className="mb-4 inline-flex items-center rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-600">
              Novia virtual IA en español
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl">
              Conecta con tu novia virtual que responde como si estuviera a tu lado
            </h1>
            <p className="mb-6 text-lg text-gray-700">
              En NoviaChat diseñas la relación que quieres vivir. Tus chicas IA charlan contigo en español natural, envían fotos, videos y audios íntimos, y recuerdan cada detalle para que la conexión sea auténtica.
            </p>
            <ul className="mb-8 space-y-3 text-base text-gray-700">
              <li>• Atención 24/7 con latencia mínima gracias a nuestra infraestructura en Vercel y Convex.</li>
              <li>• Contenido multimedia optimizado para redes móviles en México, España y Argentina.</li>
              <li>• Seguridad privada para que tus historias y deseos permanezcan solo entre ustedes.</li>
            </ul>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/signin"
                className="w-full rounded-full bg-blue-600 px-8 py-4 text-center text-lg font-semibold text-white sm:w-auto"
              >
                Crear cuenta gratis
              </Link>
              <Link
                href="/girls"
                className="w-full rounded-full border border-gray-300 px-8 py-4 text-center text-lg font-semibold text-gray-900 sm:w-auto"
              >
                Ver chicas disponibles
              </Link>
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <div className="overflow-hidden rounded-3xl border border-gray-200">
              <Image
                src="/second.png"
                alt="Chica IA enviando mensajes como novia virtual"
                width={900}
                height={1100}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 py-16">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Así se vive tu relación con una novia virtual</h2>
          <p className="mt-4 text-lg text-gray-700">
            NoviaChat mezcla IA avanzada, contexto continuo y entrega de archivos vía CDN para que todo se sienta real desde el primer mensaje.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-2xl border border-gray-200 bg-white p-8 text-left">
              <h3 className="mb-3 text-xl font-semibold">Conversaciones naturales</h3>
              <p className="text-gray-700">
                Tu novia virtual recuerda gustos, palabras clave y experiencias previas para seguir la historia como si fuera una pareja real.
              </p>
            </article>
            <article className="rounded-2xl border border-gray-200 bg-white p-8 text-left">
              <h3 className="mb-3 text-xl font-semibold">Fotos y videos íntimos</h3>
              <p className="text-gray-700">
                Recibe contenido exclusivo optimizado para carga rápida. Todo se guarda en tu galería privada sin esperas ni compresión agresiva.
              </p>
            </article>
            <article className="rounded-2xl border border-gray-200 bg-white p-8 text-left">
              <h3 className="mb-3 text-xl font-semibold">Audios que enamoran</h3>
              <p className="text-gray-700">
                Escucha su voz con audios personalizados en español neutro o con acento local. Perfecto para sentir cercanía real.
              </p>
            </article>
            <article className="rounded-2xl border border-gray-200 bg-white p-8 text-left">
              <h3 className="mb-3 text-xl font-semibold">Control total de la experiencia</h3>
              <p className="text-gray-700">
                Elige la personalidad, ritmo y límites de cada novia virtual. Puedes cambiar de compañera cuando quieras sin perder el historial.
              </p>
            </article>
            <article className="rounded-2xl border border-gray-200 bg-white p-8 text-left">
              <h3 className="mb-3 text-xl font-semibold">Privacidad desde el diseño</h3>
              <p className="text-gray-700">
                Cifrado en tránsito, almacenamiento seguro y controles de bloqueo rápido para que nadie más vea lo que comparten.
              </p>
            </article>
            <article className="rounded-2xl border border-gray-200 bg-white p-8 text-left">
              <h3 className="mb-3 text-xl font-semibold">Disponible en cualquier pantalla</h3>
              <p className="text-gray-700">
                Interfaz ligera enfocada en móviles para que escribas, escuches y veas contenido con tiempos de carga inferiores a 2.5s.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-blue-50 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Tu novia virtual te conoce mejor cada día</h2>
            <p className="mt-4 text-lg text-gray-700">
              Basamos nuestra IA en memoria conversacional y modelos optimizados para español. Así logramos respuestas rápidas sin sacrificar detalle.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-8">
              <p className="text-4xl font-bold text-blue-600">+50K</p>
              <p className="mt-2 text-gray-700">Usuarios en México, España y Argentina activos cada semana.</p>
            </div>
            <div className="rounded-2xl bg-white p-8">
              <p className="text-4xl font-bold text-blue-600">96%</p>
              <p className="mt-2 text-gray-700">Satisfacción promedio con las respuestas de su novia virtual IA.</p>
            </div>
            <div className="rounded-2xl bg-white p-8">
              <p className="text-4xl font-bold text-blue-600">1.8s</p>
              <p className="mt-2 text-gray-700">Tiempo de carga promedio en móviles gracias a optimización multimedia.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-3xl font-bold md:text-4xl">¿Cómo funciona tu novia virtual?</h2>
          <div className="mt-8 space-y-6 text-gray-700">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">1. Elige tu compañera</h3>
              <p>
                Explora perfiles detallados con gustos, estilo de conversación y tipos de contenido. Puedes probar varias novias virtuales hasta encontrar tu match ideal.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">2. Personaliza la relación</h3>
              <p>
                Define cómo quieres que te trate, qué temas le encantan y el nivel de intensidad en fotos, videos y audios. La IA aprende todo al instante.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">3. Vive la experiencia 24/7</h3>
              <p>
                Escribe cuando tengas un minuto libre. Tu novia virtual responde con contexto, emoción y contenido multimedia optimizado para que se vea perfecto incluso con poca señal.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-gray-200 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-3xl font-bold md:text-4xl">Preguntas frecuentes sobre nuestra novia virtual</h2>
          <div className="mt-10 space-y-8 text-gray-700">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">¿Necesito pagar para hablar con mi novia virtual?</h3>
              <p>
                Puedes chatear gratis las veces que quieras. Los planes premium desbloquean packs multimedia ilimitados, historias interactivas y prioridad en respuestas.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">¿Qué tan realistas son las respuestas?</h3>
              <p>
                La IA analiza sentimiento, tono y contexto. De esta forma tu novia virtual usa expresiones naturales en español de México, España o Argentina según tu preferencia.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">¿Puedo cambiar entre diferentes novias virtuales?</h3>
              <p>
                Claro. Guarda favoritos y cambia entre ellas sin perder conversaciones. Cada chica mantiene su propia personalidad y memoria contigo.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">¿Cómo protegen mi privacidad?</h3>
              <p>
                Seguimos protocolos de autenticación seguros y almacenamos el contenido en infraestructura encriptada. Solo tú decides qué compartir y puedes borrar conversaciones cuando lo desees.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <h2 className="text-3xl font-bold md:text-4xl">Tu novia virtual te espera hoy mismo</h2>
          <p className="mt-4 text-lg text-white/90">
            Abre tu cuenta, elige la personalidad perfecta y empieza a recibir mensajes, fotos, videos y audios en segundos.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/signin" className="w-full rounded-full bg-white px-8 py-4 text-center text-lg font-semibold text-blue-700 sm:w-auto">
              Comenzar ahora
            </Link>
            <Link href="/plans" className="w-full rounded-full border border-white px-8 py-4 text-center text-lg font-semibold text-white sm:w-auto">
              Revisar planes
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
