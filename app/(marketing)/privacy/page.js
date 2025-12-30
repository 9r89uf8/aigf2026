import Link from "next/link";

export const metadata = {
  title: { absolute: "Política de Privacidad | NoviaChat" },
  description:
    "Política de privacidad de NoviaChat: qué datos recopilamos, para qué los usamos, con quién se comparten y cómo solicitar acceso o eliminación.",
  robots: "index, follow",
  alternates: { canonical: "/privacy" },
};

const SUPPORT_EMAIL = "support@noviachat.com";

export default function PrivacyPage() {
  return (
    <main className="font-sans bg-white text-gray-900">
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-6 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Legal
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Política de privacidad</h1>
          <p className="mt-4 text-lg text-gray-600">
            Esta política explica qué datos recopilamos, para qué los usamos y cómo puedes
            contactarnos.
          </p>
          <p className="mt-4 text-sm text-gray-500">Última actualización: 15 de diciembre de 2025</p>
        </div>
      </section>

      <section className="pb-14 md:pb-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="space-y-10 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">Resumen</h2>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>Usamos tus datos para operar el servicio, seguridad, pagos y soporte.</li>
                <li>Los pagos se procesan con proveedores externos (por ejemplo, Stripe).</li>
                <li>
                  Puedes solicitar acceso o eliminación escribiendo a{" "}
                  <a
                    className="font-semibold text-blue-700 hover:underline"
                    href={`mailto:${SUPPORT_EMAIL}`}
                  >
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">Datos que podemos recopilar</h2>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>
                  <strong>Cuenta:</strong> correo electrónico y datos básicos de perfil que
                  completes (por ejemplo, nombre/país).
                </li>
                <li>
                  <strong>Uso del servicio:</strong> interacciones dentro de la app, eventos
                  técnicos y diagnósticos (por ejemplo, errores).
                </li>
                <li>
                  <strong>Contenido:</strong> mensajes y contenido que envíes o recibas dentro del
                  servicio (incluyendo archivos si aplica).
                </li>
                <li>
                  <strong>Pagos:</strong> información de transacciones y estado premium. No
                  almacenamos números completos de tarjeta; los pagos se manejan por el procesador
                  de pagos.
                </li>
                <li>
                  <strong>Datos técnicos:</strong> información del dispositivo/navegador, dirección
                  IP y registros de seguridad para prevenir fraude y abuso.
                </li>
                <li>
                  <strong>Cookies/analytics:</strong> medición de tráfico y rendimiento (por
                  ejemplo, Google Analytics), según configuración del navegador.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">Cómo usamos los datos</h2>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>Crear y administrar tu cuenta.</li>
                <li>Prestar el servicio y mejorar la experiencia (rendimiento, estabilidad).</li>
                <li>Procesar pagos, prevenir fraude y cumplir obligaciones legales.</li>
                <li>Soporte al cliente y comunicaciones relacionadas al servicio.</li>
                <li>Seguridad: detección de abuso y protección de la plataforma.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">Con quién compartimos datos</h2>
              <p className="mt-4">
                Podemos compartir datos con proveedores que nos ayudan a operar NoviaChat (por
                ejemplo, hosting/infraestructura, analítica, verificación anti-bots y procesadores
                de pagos). Estos proveedores procesan datos en nuestro nombre para prestar el
                servicio.
              </p>
              <p className="mt-4">
                También podemos divulgar información si es necesario para cumplir con la ley, hacer
                cumplir nuestros términos o proteger la seguridad de usuarios y la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">Retención</h2>
              <p className="mt-4">
                Conservamos datos solo el tiempo necesario para operar el servicio, cumplir
                obligaciones legales y resolver disputas. Los periodos pueden variar según el tipo
                de dato.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">Seguridad</h2>
              <p className="mt-4">
                Implementamos medidas técnicas y organizativas razonables para proteger datos.
                Ningún sistema es 100% seguro; evita compartir información altamente sensible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">Tus opciones</h2>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>
                  <strong>Acceso/actualización:</strong> puedes actualizar información del perfil
                  desde tu cuenta.
                </li>
                <li>
                  <strong>Eliminación:</strong> puedes solicitar eliminación de tu cuenta y/o datos
                  escribiendo a{" "}
                  <a
                    className="font-semibold text-blue-700 hover:underline"
                    href={`mailto:${SUPPORT_EMAIL}`}
                  >
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </li>
                <li>
                  <strong>Cookies/analytics:</strong> puedes ajustar permisos desde tu navegador.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">Menores</h2>
              <p className="mt-4">
                NoviaChat está destinado a adultos. Si crees que un menor ha usado el servicio,
                contáctanos de inmediato en{" "}
                <a
                  className="font-semibold text-blue-700 hover:underline"
                  href={`mailto:${SUPPORT_EMAIL}`}
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">Cambios</h2>
              <p className="mt-4">
                Podemos actualizar esta política. Publicaremos la versión vigente en esta página
                con la fecha de actualización.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">Contacto</h2>
              <p className="mt-4">
                Para dudas de privacidad o solicitudes, escribe a{" "}
                <a
                  className="font-semibold text-blue-700 hover:underline"
                  href={`mailto:${SUPPORT_EMAIL}`}
                >
                  {SUPPORT_EMAIL}
                </a>{" "}
                o visita <Link href="/support" className="font-semibold text-blue-700 hover:underline">Soporte</Link>.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
