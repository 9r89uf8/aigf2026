import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_HUBS, CATEGORY_SLUGS, GUIDE_PAGES } from "@/app/lib/seo-content";

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((slug) => ({ categoria: slug }));
}

export async function generateMetadata({ params }) {
  const { categoria } = await params;
  const category = CATEGORY_HUBS.find((item) => item.slug === categoria);
  if (!category) return {};

  return {
    title: { absolute: `${category.name} | NoviaChat` },
    description: category.teaser,
    keywords: "chicas virtuales, chicas ia, companera virtual, novia virtual",
    robots: "index, follow",
    alternates: {
      canonical: `/chicas-virtuales/${category.slug}`,
      languages: {
        "es-MX": `/chicas-virtuales/${category.slug}`,
        "es-ES": `/chicas-virtuales/${category.slug}`,
        "es-AR": `/chicas-virtuales/${category.slug}`,
      },
    },
    openGraph: {
      title: `${category.name} | NoviaChat`,
      description: category.teaser,
      url: `https://www.noviachat.com/chicas-virtuales/${category.slug}`,
      siteName: "NoviaChat",
      type: "website",
      locale: "es_MX",
      alternateLocale: ["es_ES", "es_AR"],
      images: [
        {
          url: "/second.webp",
          width: 1200,
          height: 630,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} | NoviaChat`,
      description: category.teaser,
      images: ["/second.webp"],
    },
  };
}

export default async function CategoriaPage({ params }) {
  const { categoria } = await params;
  const category = CATEGORY_HUBS.find((item) => item.slug === categoria);

  if (!category) {
    notFound();
  }

  const relatedCategories = category.related
    .map((slug) => CATEGORY_HUBS.find((item) => item.slug === slug))
    .filter(Boolean);

  const relatedGuides = GUIDE_PAGES.filter(
    (guide) => guide.category === `/chicas-virtuales/${category.slug}`
  ).slice(0, 2);

  return (
    <main className="font-sans bg-white text-gray-900">
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-5 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            {category.name}
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{category.name}</h1>
          <p className="mt-4 text-lg text-gray-700">{category.intro}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Empezar chat
            </Link>
            <Link
              href="/chicas-virtuales"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Volver al directorio
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Resumen en 5 puntos</h2>
          <ul className="mt-4 space-y-3 text-gray-700">
            {category.summary.map((point) => (
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
          <h2 className="text-2xl font-semibold">Lo que encuentras en esta categoria</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {category.features.map((feature) => (
              <div key={feature} className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-gray-700">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-semibold">Seleccion curada</h2>
          <p className="mt-3 text-gray-700">
            Ideas y momentos para vivir una conversacion con este estilo.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {category.highlights.map((item) => (
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
            {category.faqs.map((faq) => (
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
              href={category.primaryPillar}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Hub principal
            </Link>
          </div>

          {relatedCategories.length > 0 ? (
            <div className="mt-8">
              <h3 className="text-lg font-semibold">Categorias relacionadas</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {relatedCategories.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/chicas-virtuales/${item.slug}`}
                    className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {relatedGuides.length > 0 ? (
            <div className="mt-8">
              <h3 className="text-lg font-semibold">Guias recomendadas</h3>
              <div className="mt-3 space-y-2">
                {relatedGuides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/guias/${guide.slug}`}
                    className="block text-sm font-semibold text-blue-700 hover:underline"
                  >
                    {guide.title}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-blue-600 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <h2 className="text-2xl font-semibold">Listo para probar este estilo?</h2>
          <p className="mt-3 text-white/90">
            Crea tu cuenta gratis y empieza a chatear con tu chica virtual ideal.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700"
            >
              Empezar gratis
            </Link>
            <Link
              href="/chicas"
              className="inline-flex items-center justify-center rounded-xl border border-white/60 px-6 py-3 text-sm font-semibold text-white"
            >
              Ver perfiles
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
