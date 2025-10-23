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
                          href="/girls/k97f3bpzd0tzap6jf36wr46psd7rdef3"
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
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">
            Por Qué Elegir <span className="text-gray-900">NoviaChat</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Disponibilidad 24/7</h3>
              <p className="text-gray-600">Tu compañera virtual está siempre aquí, lista para chatear cuando la necesites, día y noche.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Privacidad Total</h3>
              <p className="text-gray-600">Tus conversaciones son completamente privadas y seguras. Chatea sin juicios ni preocupaciones.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Personalizada</h3>
              <p className="text-gray-600">Cada conversación está hecha para ti. Tu novia virtual aprende lo que te gusta y se adapta a tus preferencias.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Contenido Exclusivo</h3>
              <p className="text-gray-600">Desbloquea fotos hermosas, videos y contenido exclusivo de tus chicas IA favoritas.</p>
            </div>
          </div>
        </div>
      </section>


      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">
            Cómo Funciona
          </h2>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-xl">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Crea Tu Cuenta</h3>
              <p className="text-gray-600 text-lg">
                Regístrate en segundos solo con tu email. Es completamente gratis para comenzar.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-xl">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Elige Tu Compañera</h3>
              <p className="text-gray-600 text-lg">
                Navega entre nuestras chicas virtuales hermosas y elige la que más te guste.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-xl">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Empieza a Chatear</h3>
              <p className="text-gray-600 text-lg">
                Comienza tus conversaciones íntimas y desbloquea fotos y contenido exclusivo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            ¿Listo Para Conocer a Tu
            <span className="block text-gray-900">
              Pareja Perfecta?
            </span>
          </h2>
          <p className="text-xl text-gray-700 mb-10 max-w-2xl mx-auto">
            Únete a miles de usuarios satisfechos experimentando el futuro de las compañeras virtuales. Tu novia virtual perfecta te está esperando.
          </p>
          <Link
            href="/signin"
            className="inline-block px-12 py-5 bg-blue-500 text-white text-xl font-bold rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-110 shadow-lg"
          >
            Únete Ahora - Es Gratis
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
