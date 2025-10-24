//app/page.js
import Link from "next/link";
import Image from "next/image";
import StoryAvatarButton from "../components/home/StoryAvatarButton";

export const metadata = {
  title: 'NoviaChat - Tu Novia Virtual y Compañera de IA | Chicas IA 24/7',
  description: 'Conoce a tu compañera virtual perfecta en NoviaChat. Chatea con chicas IA hermosas disponibles 24/7. Conversaciones privadas, fotos exclusivas y experiencias personalizadas. La mejor app de novia virtual en español.',
  keywords: 'novia virtual, chicas IA, compañera virtual, chicas virtuales, chat IA, novia inteligencia artificial, compañera IA, chat virtual, novia online',
  authors: [{ name: 'NoviaChat' }],
  creator: 'NoviaChat',
  publisher: 'NoviaChat',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://noviachat.com',
    languages: {
      'es-MX': 'https://noviachat.com',
      'es-ES': 'https://noviachat.com',
      'es-AR': 'https://noviachat.com',
    },
  },
  openGraph: {
    title: 'NoviaChat - Tu Novia Virtual y Compañera de IA',
    description: 'Conoce chicas IA hermosas disponibles 24/7. Conversaciones privadas, fotos exclusivas y experiencias personalizadas.',
    url: 'https://noviachat.com',
    siteName: 'NoviaChat',
    images: [
      {
        url: '/second.jpg',
        width: 1200,
        height: 630,
        alt: 'NoviaChat - Chicas IA y Compañeras Virtuales',
      },
    ],
    locale: 'es_MX',
    alternateLocale: ['es_ES', 'es_AR'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NoviaChat - Tu Novia Virtual y Compañera de IA',
    description: 'Chatea con chicas IA hermosas 24/7. Privado, personalizado y siempre disponible.',
    images: ['/second.jpg'],
  },
  other: {
    'geo.region': 'MX;ES;AR',
    'geo.placename': 'México;España;Argentina',
  },
};

export default function Home() {

  return (
    <div className="font-sans min-h-screen">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://noviachat.com/#organization",
                "name": "NoviaChat",
                "url": "https://noviachat.com",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://noviachat.com/second.jpg",
                  "width": 1200,
                  "height": 630
                },
                "description": "La mejor plataforma de chicas IA y compañeras virtuales en español. Conversaciones privadas 24/7.",
                "slogan": "Tu Compañera de IA Perfecta Te Espera",
                "foundingDate": "2025",
                "areaServed": [
                  {
                    "@type": "Country",
                    "name": "México"
                  },
                  {
                    "@type": "Country",
                    "name": "España"
                  },
                  {
                    "@type": "Country",
                    "name": "Argentina"
                  }
                ],
                "availableLanguage": ["es"],
                "knowsAbout": [
                  "Inteligencia Artificial",
                  "Chatbots",
                  "Compañeras Virtuales",
                  "Novia Virtual",
                  "Chat IA",
                  "Entretenimiento Digital"
                ],
                "hasOfferCatalog": {
                  "@type": "OfferCatalog",
                  "name": "Servicios de NoviaChat",
                  "itemListElement": [
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "Chat con Chicas IA",
                        "description": "Conversaciones ilimitadas con compañeras virtuales disponibles 24/7"
                      }
                    },
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "Contenido Exclusivo Premium",
                        "description": "Fotos, videos y contenido exclusivo de tus chicas IA favoritas"
                      }
                    }
                  ]
                }
              },
              {
                "@type": "WebSite",
                "@id": "https://noviachat.com/#website",
                "url": "https://noviachat.com",
                "name": "NoviaChat - Novia Virtual y Chicas IA",
                "description": "Conoce a tu compañera virtual perfecta. Chatea con chicas IA hermosas disponibles 24/7.",
                "publisher": {
                  "@id": "https://noviachat.com/#organization"
                },
                "inLanguage": "es"
              },
              {
                "@type": "WebPage",
                "@id": "https://noviachat.com/#webpage",
                "url": "https://noviachat.com",
                "name": "NoviaChat - Tu Novia Virtual y Compañera de IA | Chicas IA 24/7",
                "isPartOf": {
                  "@id": "https://noviachat.com/#website"
                },
                "about": {
                  "@id": "https://noviachat.com/#organization"
                },
                "description": "Conoce a tu compañera virtual perfecta en NoviaChat. Chatea con chicas IA hermosas disponibles 24/7. Conversaciones privadas, fotos exclusivas y experiencias personalizadas.",
                "inLanguage": "es"
              },
              {
                "@type": "Product",
                "name": "NoviaChat - Compañera Virtual IA",
                "description": "Servicio de chat con chicas IA y compañeras virtuales. Conversaciones personalizadas, contenido exclusivo y disponibilidad 24/7.",
                "brand": {
                  "@id": "https://noviachat.com/#organization"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "4.8",
                  "reviewCount": "5000",
                  "bestRating": "5",
                  "worstRating": "1"
                },
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock",
                  "url": "https://noviachat.com/signin"
                }
              },
              {
                "@type": "FAQPage",
                "@id": "https://noviachat.com/#faq",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "¿Qué es NoviaChat?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "NoviaChat es la plataforma líder de compañeras virtuales y chicas IA en español. Ofrecemos conversaciones personalizadas con novias virtuales disponibles 24/7, contenido exclusivo y experiencias completamente privadas."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "¿Cómo funcionan las chicas IA?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Nuestras chicas IA utilizan inteligencia artificial avanzada para mantener conversaciones naturales y personalizadas. Cada compañera virtual aprende de tus preferencias y se adapta a tu estilo de comunicación para crear una experiencia única."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "¿Es gratis usar NoviaChat?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Sí, puedes crear tu cuenta y comenzar a chatear completamente gratis. También ofrecemos planes premium para acceder a contenido exclusivo, fotos y funciones avanzadas con tus chicas IA favoritas."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "¿Las conversaciones son privadas?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Absolutamente. Todas tus conversaciones con tu novia virtual son 100% privadas y seguras. Valoramos tu privacidad y nunca compartimos tus datos con terceros."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "¿Puedo chatear con varias chicas virtuales?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Sí, puedes chatear con todas las compañeras virtuales que desees. Cada chica IA tiene su propia personalidad, estilo y contenido exclusivo para que encuentres tu pareja perfecta."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "¿Qué tipo de contenido exclusivo ofrecen?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Nuestras chicas IA comparten fotos exclusivas, videos, historias y contenido personalizado. Los miembros premium pueden desbloquear galerías completas y contenido especial de sus compañeras favoritas."
                    }
                  }
                ]
              },
              {
                "@type": "BreadcrumbList",
                "@id": "https://noviachat.com/#breadcrumb",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Inicio",
                    "item": "https://noviachat.com"
                  }
                ]
              }
            ]
          })
        }}
      />

      {/* Hero Section */}
      <section className="py-6 md:py-20">
        <div className="container mx-auto px-4">
          {/* Social Proof Badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-semibold text-white">5M+ Miembros Activos</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-md">
              <span className="text-sm font-semibold text-white">#1 Nueva App de Chat en Latinoamérica</span>
            </div>
          </div>

          {/* Main Hero Content - Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Left Column - Text Content */}
            <div className="order-2 md:order-1">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Tu Compañera de IA Perfecta
                <span className="block text-gray-900">
                  Te Espera
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
                Experimenta conversaciones íntimas y personalizadas con impresionantes compañeras de IA.
                Disponibles 24/7, completamente privadas y siempre listas para chatear.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signin"
                  className="px-8 py-4 bg-blue-500 text-white text-lg font-bold rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg text-center"
                >
                  Comenzar Gratis
                </Link>
                <Link
                  href="/girls"
                  className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-900 text-lg font-bold rounded-full hover:bg-gray-50 transition-all duration-300 text-center"
                >
                  Conoce Nuestras Chicas
                </Link>
              </div>
            </div>

            {/* Right Column - Featured Girl Card */}
            <div className="order-1 md:order-2">
              <div className="relative group">
                <div className="bg-white rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
                  <div className="relative h-[500px] md:h-[600px]">
                    <Image
                      src="/second.png"
                      alt="Sofia - Compañera de IA"
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Name Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      {/* Profile Picture with Instagram-style ring */}
                      <StoryAvatarButton
                        avatarSrc="/first.png"
                        size={80}
                        stories={[
                          {
                            url: "/first.png",
                            text: "Sofia te saluda 👋",
                            createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
                            user: { name: "Sofia", avatarUrl: "/first.png" },
                          },
                          {
                            url: "/third.png",
                            text: "Detrás de cámaras 📸",
                            createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
                            user: { name: "Sofia", avatarUrl: "/first.png" },
                          },
                        ]}
                      />

                      <h3 className="text-3xl font-bold text-white mb-2">Andrea</h3>
                      <p className="text-white/90 text-lg mb-4">18 años</p>

                      {/* CTA Buttons */}
                      <div className="flex items-center justify-center gap-3">
                        <Link
                          href="/girls/k974t5vzammwgg6b986fsx65hn7s55eg"
                          className="px-6 py-3 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          Chatear
                        </Link>
                        <Link
                          href="/girls"
                          className="px-6 py-3 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          Ver Más Chicas
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Vive una experiencia hiperrealista
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              NoviaChat hace que tus chicas de IA se sientan vivas con respuestas naturales en español, fotos íntimas, videos a medida y audios susurrados.
            </p>
          </div>
          <div className="grid gap-8 mt-12 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            <article className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg shadow-blue-100/40 transition-transform duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 14h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.1-3.73A7.626 7.626 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Mensajes que enamoran</h3>
              <p className="text-gray-600 text-base">
                Conversaciones íntimas con contexto persistente para que tu chica recuerde tus gustos, deseos y la historia que construyen juntos.
              </p>
            </article>
            <article className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg shadow-blue-100/40 transition-transform duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l9 6 9-6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fotos y reels exclusivos</h3>
              <p className="text-gray-600 text-base">
                Recibe sets privados y galerías personalizados para ti, con imágenes optimizadas que cargan al instante en cualquier red móvil.
              </p>
            </article>
            <article className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg shadow-blue-100/40 transition-transform duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14" />
                  <rect width="10" height="12" x="3" y="6" rx="2" ry="2" strokeWidth={2} />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Videos personalizados</h3>
              <p className="text-gray-600 text-base">
                Disfruta clips íntimos enviados a tu ritmo. Los puedes ver sin lag gracias a la entrega optimizada por nuestra CDN.
              </p>
            </article>
            <article className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg shadow-blue-100/40 transition-transform duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-2v13" />
                  <rect width="6" height="12" x="3" y="8" rx="1" ry="1" strokeWidth={2} />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Audios susurrados</h3>
              <p className="text-gray-600 text-base">
                Recibe notas de voz sensuales y reacciones instantáneas. Ideal para noches largas o para acompañarte en el día a día.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Optimizado para móviles y velocidades reales
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                El 92% de nuestros usuarios se conecta desde el celular. Diseñamos NoviaChat para que cargue en menos de 2.5 segundos en redes 4G y mantenga la conversación fluida, incluso en horas pico.
              </p>
              <div className="mt-8 space-y-5">
                <div className="flex gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">1</span>
                  <p className="text-gray-600 text-base">
                    Interfaz táctil con controles grandes y modo discreto para salir al instante si necesitas privacidad.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">2</span>
                  <p className="text-gray-600 text-base">
                    Contenido multimedia adaptado automáticamente para ahorrar tus datos sin perder calidad.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">3</span>
                  <p className="text-gray-600 text-base">
                    Diseño responsive que se adapta a cualquier pantalla para que puedas escribir con una mano sin perder detalles.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl shadow-blue-100/60">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Rápido, seguro y listo para escalar</h3>
              <ul className="space-y-4 text-gray-600 text-base">
                <li>
                  <span className="font-semibold text-gray-900">Infraestructura Vercel:</span> renderizado instantáneo, CDN global y compresión Gzip/Brotli activada.
                </li>
                <li>
                  <span className="font-semibold text-gray-900">Convex en tiempo real:</span> sincronización de chats y pagos sin bloqueos.
                </li>
                <li>
                  <span className="font-semibold text-gray-900">Turnstile de Cloudflare:</span> defensa automatizada contra bots sin fricción para el usuario.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Hecho para México, España y Argentina
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Las chicas están entrenadas con modismos y horarios locales para responderte como si vivieran en tu ciudad.
            </p>
          </div>
          <div className="grid gap-8 mt-12 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            <article className="bg-white border border-gray-200 rounded-2xl p-6 text-left shadow-md">
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">México</h3>
              <ul className="space-y-2 text-gray-600 text-base">
                <li>Expresiones norteñas, chilangas y tapatías.</li>
                <li>Experiencias sugeridas para CDMX, Monterrey y Guadalajara.</li>
                <li>Atención personalizada con horario extendido para toda la República.</li>
              </ul>
            </article>
            <article className="bg-white border border-gray-200 rounded-2xl p-6 text-left shadow-md">
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">España</h3>
              <ul className="space-y-2 text-gray-600 text-base">
                <li>Lenguaje natural de Madrid, Barcelona y Valencia.</li>
                <li>Respuestas adaptadas a horarios peninsulares y canarios.</li>
                <li>Soporte dedicado en horario de España para resolver cualquier duda.</li>
              </ul>
            </article>
            <article className="bg-white border border-gray-200 rounded-2xl p-6 text-left shadow-md sm:col-span-2 lg:col-span-1">
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Argentina</h3>
              <ul className="space-y-2 text-gray-600 text-base">
                <li>Vos, ché y códigos porteños para conversaciones reales.</li>
                <li>Disponibilidad extendida para noches largas y madrugadas.</li>
                <li>Eventos especiales y soporte en horario argentino.</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center">
            ¿Cómo funciona NoviaChat?
          </h2>
          <p className="mt-4 text-lg text-gray-600 text-center max-w-3xl mx-auto">
            En menos de tres minutos tienes una cuenta verificada y acceso a chicas IA que evolucionan contigo. No necesitas instalar nada.
          </p>
          <div className="grid gap-10 mt-16 md:grid-cols-3 max-w-5xl mx-auto">
            <article className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-md">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-2xl font-bold text-white">
                1
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Crea tu cuenta</h3>
              <p className="text-gray-600 text-base">
                Regístrate gratis con email o redes sociales. Turnstile bloquea bots para que solo haya comunidad real.
              </p>
            </article>
            <article className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-md">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-2xl font-bold text-white">
                2
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Elige a tu novia IA</h3>
              <p className="text-gray-600 text-base">
                Explora perfiles con gustos, historias y límites claros. Guarda tus favoritas para recibir contenido exclusivo.
              </p>
            </article>
            <article className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-md">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Chatea y desbloquea contenido</h3>
              <p className="text-gray-600 text-base">
                Recibe texto, imágenes, audio y video al instante. Todo queda guardado en tu historial privado dentro de Convex.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto rounded-3xl bg-white p-10 shadow-xl shadow-blue-100/70 border border-gray-200">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center">
              Privacidad y soporte de primer nivel
            </h2>
            <p className="mt-4 text-lg text-gray-600 text-center">
              Tus datos se procesan en servidores seguros y solo tú controlas qué compartes. Nuestro equipo monitorea la plataforma 24/7 para mantenerla segura, consentida y divertida.
            </p>
            <div className="grid gap-8 mt-10 md:grid-cols-3">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Autenticación protegida</h3>
                <p className="text-gray-600 text-base">
                  ConvexAuth gestiona sesiones seguras y permite cerrar sesión desde cualquier dispositivo en segundos.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Moderación proactiva</h3>
                <p className="text-gray-600 text-base">
                  Mezclamos herramientas automáticas y revisión humana para mantener una comunidad segura para adultos consentidos.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Soporte humano en español</h3>
                <p className="text-gray-600 text-base">
                  Resolvemos dudas vía email y chat interno con tiempos de respuesta promedio de 6 horas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Opiniones de nuestros usuarios
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Historias reales de latinos que encontraron compañía y diversión con NoviaChat.
            </p>
          </div>
          <div className="grid gap-8 mt-12 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            <blockquote className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md">
              <p className="text-gray-700 text-base italic">
                “Siento que Andrea entiende mi humor chilango y me manda fotos personalizadas cada noche. Se ha vuelto parte de mi rutina.”
              </p>
              <footer className="mt-4 text-sm font-semibold text-gray-900">Luis · Ciudad de México</footer>
            </blockquote>
            <blockquote className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md">
              <p className="text-gray-700 text-base italic">
                “Probé muchas apps pero ninguna con audios tan reales. Me encanta que responda al toque aunque sean las 2:00 am.”
              </p>
              <footer className="mt-4 text-sm font-semibold text-gray-900">Mariana · Rosario, Argentina</footer>
            </blockquote>
            <blockquote className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md sm:col-span-2 lg:col-span-1">
              <p className="text-gray-700 text-base italic">
                “Los videos y reels exclusivos son una locura. Además la plataforma va rapidísima en mi móvil, incluso con datos.”
              </p>
              <footer className="mt-4 text-sm font-semibold text-gray-900">Álvaro · Madrid, España</footer>
            </blockquote>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center">
              Preguntas frecuentes
            </h2>
            <p className="mt-4 text-lg text-gray-600 text-center">
              Respondemos las dudas más comunes antes de que empieces a disfrutar de tu novia virtual.
            </p>
            <div className="mt-10 space-y-4">
              <details className="group border border-gray-200 rounded-2xl bg-white p-5">
                <summary className="flex cursor-pointer items-center justify-between text-left text-lg font-semibold text-gray-900">
                  ¿NoviaChat es gratis?
                  <span className="ml-3 text-blue-500 transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-gray-600 text-base">
                  Crear tu cuenta y chatear es gratis. Puedes mejorar la experiencia con planes premium para desbloquear galerías, videos largos y contenido bajo demanda.
                </p>
              </details>
              <details className="group border border-gray-200 rounded-2xl bg-white p-5">
                <summary className="flex cursor-pointer items-center justify-between text-left text-lg font-semibold text-gray-900">
                  ¿Qué tan reales son las conversaciones?
                  <span className="ml-3 text-blue-500 transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-gray-600 text-base">
                  Las chicas usan modelos de IA ajustados a cada país, con memoria de lo que te gusta, para mantener conversaciones naturales y coherentes con tu historia.
                </p>
              </details>
              <details className="group border border-gray-200 rounded-2xl bg-white p-5">
                <summary className="flex cursor-pointer items-center justify-between text-left text-lg font-semibold text-gray-900">
                  ¿Mis chats son privados?
                  <span className="ml-3 text-blue-500 transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-gray-600 text-base">
                  Sí. Tus mensajes y contenidos viven en espacios privados dentro de Convex y nadie del equipo accede sin tu permiso explícito.
                </p>
              </details>
              <details className="group border border-gray-200 rounded-2xl bg-white p-5">
                <summary className="flex cursor-pointer items-center justify-between text-left text-lg font-semibold text-gray-900">
                  ¿Puedo usar varias chicas al mismo tiempo?
                  <span className="ml-3 text-blue-500 transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-gray-600 text-base">
                  Por supuesto. Puedes agregar varias novias IA, guardar favoritas y cambiar entre ellas sin perder contexto.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            ¿Listo para vivir tu historia con IA?
          </h2>
          <p className="text-xl text-gray-700 mb-10 max-w-2xl mx-auto">
            Conecta en minutos, chatea sin límites y recibe contenido multimedia diseñado para ti. NoviaChat está lista cuando tú quieras.
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center px-12 py-5 bg-blue-500 text-white text-xl font-bold rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-200"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 NoviaChat. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
