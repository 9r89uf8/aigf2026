import MensajesPreview from "./MensajesPreview";

export const metadata = {
  title: { absolute: "Mensajes con Novia Virtual | Vista previa de chat - NoviaChat" },
  description:
    "Explora la vista previa del chat de NoviaChat y escribe tu primer mensaje. Inicia sesion o crea una cuenta para enviarlo.",
  keywords:
    "mensajes novia virtual, chat en espanol, conversacion IA, vista previa chat, novia virtual",
  robots: "index, follow",
  alternates: {
    canonical: "/mensajes",
    languages: {
      "es-MX": "/mensajes",
      "es-ES": "/mensajes",
      "es-AR": "/mensajes",
    },
  },
  openGraph: {
    title: "Mensajes con novia virtual | Vista previa del chat",
    description:
      "Explora la vista previa del chat y crea tu cuenta para enviar mensajes en segundos.",
    url: "https://www.noviachat.com/mensajes",
    siteName: "NoviaChat",
    type: "website",
    locale: "es_MX",
    alternateLocale: ["es_ES", "es_AR"],
    images: [
      {
        url: "/second.webp",
        width: 1200,
        height: 630,
        alt: "Vista previa del chat de NoviaChat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mensajes con novia virtual | Vista previa del chat",
    description: "Explora la vista previa del chat y crea tu cuenta para enviar mensajes.",
    images: ["/second.webp"],
  },
};

export default function MensajesPage() {
  return <MensajesPreview />;
}
