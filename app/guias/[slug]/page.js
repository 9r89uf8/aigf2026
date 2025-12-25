import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDE_PAGES, GUIDE_SLUGS } from "@/app/lib/seo-content";

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guide = GUIDE_PAGES.find((item) => item.slug === slug);
  if (!guide) return {};

  return {
    title: { absolute: `${guide.title} | NoviaChat` },
    description: guide.description,
    keywords: "novia virtual, chat novia virtual, chicas virtuales, guia noviachat",
    robots: "index, follow",
    alternates: {
      canonical: `/guias/${guide.slug}`,
      languages: {
        "es-MX": `/guias/${guide.slug}`,
        "es-ES": `/guias/${guide.slug}`,
        "es-AR": `/guias/${guide.slug}`,
      },
    },
    openGraph: {
      title: `${guide.title} | NoviaChat`,
      description: guide.description,
      url: `https://www.noviachat.com/guias/${guide.slug}`,
      siteName: "NoviaChat",
      type: "article",
      locale: "es_MX",
      alternateLocale: ["es_ES", "es_AR"],
      images: [
        {
          url: "/second.webp",
          width: 1200,
          height: 630,
          alt: guide.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${guide.title} | NoviaChat`,
      description: guide.description,
      images: ["/second.webp"],
    },
  };
}

export default async function GuiaPage({ params }) {
  const { slug } = await params;
  const guide = GUIDE_PAGES.find((item) => item.slug === slug);

  if (!guide) {
    notFound();
  }

  const relatedGuides = GUIDE_PAGES.filter(
    (item) => item.slug !== guide.slug && item.pillar === guide.pillar
  ).slice(0, 3);

  return (
    <main className="font-sans bg-white text-gray-900">
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-5 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Guia NoviaChat
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{guide.title}</h1>
          <p className="mt-4 text-lg text-gray-700">{guide.description}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Empezar gratis
            </Link>
            <Link
              href={guide.pillar}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Ver hub relacionado
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Resumen en 5 puntos</h2>
          <ul className="mt-4 space-y-3 text-gray-700">
            {guide.summary.map((point) => (
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
        <div className="mx-auto max-w-5xl px-4 space-y-8">
          {guide.sections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-2xl font-semibold">{section.title}</h2>
              {section.body ? <p className="mt-3 text-gray-700">{section.body}</p> : null}
              {section.bullets ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-200 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Preguntas frecuentes</h2>
          <div className="mt-6 space-y-4">
            {guide.faqs.map((faq) => (
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
              href={guide.pillar}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Hub principal
            </Link>
            <Link
              href={guide.category}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Categoria relacionada
            </Link>
            <Link
              href="/chicas-virtuales"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Directorio de chicas virtuales
            </Link>
          </div>

          {relatedGuides.length > 0 ? (
            <div className="mt-8">
              <h3 className="text-lg font-semibold">Guias relacionadas</h3>
              <div className="mt-3 space-y-2">
                {relatedGuides.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/guias/${item.slug}`}
                    className="block text-sm font-semibold text-blue-700 hover:underline"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-blue-600 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <h2 className="text-2xl font-semibold">Listo para probar?</h2>
          <p className="mt-3 text-white/90">
            Crea tu cuenta gratis y empieza a chatear con tu novia virtual en minutos.
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
