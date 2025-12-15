import Link from "next/link";

export const metadata = {
  title: { absolute: "Términos y condiciones | NoviaChat" },
  description:
    "Términos y condiciones de NoviaChat: uso permitido, suscripciones, pagos, contenido y reglas de la plataforma.",
  robots: "index, follow",
  alternates: { canonical: "/terminos" },
};

const SUPPORT_EMAIL = "support@noviachat.com";

export default function TerminosPage() {
  return (
    <main className="font-sans bg-white text-gray-900">
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-6 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Legal
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Términos y condiciones</h1>
          <p className="mt-4 text-lg text-gray-600">
            Al usar NoviaChat aceptas estos términos. Si no estás de acuerdo, no uses el servicio.
          </p>
          <p className="mt-4 text-sm text-gray-500">Última actualización: 15 de diciembre de 2025</p>
        </div>
      </section>

      <section className="pb-14 md:pb-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="space-y-10 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">1) Elegibilidad</h2>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>Debes ser mayor de edad según las leyes de tu país (en general, 18+).</li>
                <li>Debes proporcionar información precisa al crear tu cuenta.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">2) Qué es NoviaChat (y qué no es)</h2>
              <p className="mt-4">
                NoviaChat ofrece personajes y conversaciones impulsadas por inteligencia artificial
                con fines de entretenimiento. No es un servicio de citas, terapia, consejo médico o
                asesoría profesional.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">3) Reglas de uso</h2>
              <p className="mt-4">No está permitido:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Usar el servicio para actividades ilegales, fraude o suplantación.</li>
                <li>
                  Intentar acceder sin autorización, explotar vulnerabilidades o interrumpir el
                  servicio.
                </li>
                <li>Generar o solicitar contenido relacionado con menores o explotación.</li>
                <li>Compartir datos personales sensibles (tuyos o de terceros) de forma indebida.</li>
                <li>Publicar o distribuir contenido que infrinja derechos de terceros.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">4) Contenido</h2>
              <p className="mt-4">
                Eres responsable del contenido que envías. Podemos moderar, restringir o remover
                contenido o cuentas si consideramos que violan estos términos o afectan la
                seguridad de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">5) Suscripciones y pagos</h2>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>
                  Algunas funciones pueden requerir pago (por ejemplo, planes premium). Los pagos
                  se procesan mediante proveedores externos.
                </li>
                <li>
                  Los precios, características y condiciones pueden cambiar; publicaremos cambios
                  en la web o dentro del producto.
                </li>
                <li>
                  Si tienes problemas con un cobro o activación premium, visita{" "}
                  <Link href="/support" className="font-semibold text-blue-700 hover:underline">
                    Soporte
                  </Link>
                  .
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">6) Privacidad</h2>
              <p className="mt-4">
                El tratamiento de datos se describe en nuestra{" "}
                <Link href="/privacy" className="font-semibold text-blue-700 hover:underline">
                  Política de privacidad
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">7) Terminación</h2>
              <p className="mt-4">
                Podemos suspender o cerrar cuentas por incumplimiento, seguridad o por
                requerimientos legales. También puedes dejar de usar el servicio en cualquier
                momento.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">8) Limitación de responsabilidad</h2>
              <p className="mt-4">
                El servicio se proporciona “tal cual” y puede contener errores o interrupciones.
                En la medida permitida por la ley, NoviaChat no será responsable por daños
                indirectos, pérdida de datos o pérdida de beneficios derivados del uso del servicio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">9) Cambios a estos términos</h2>
              <p className="mt-4">
                Podemos actualizar estos términos. La versión vigente se publicará en esta página
                con la fecha de actualización.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">10) Contacto</h2>
              <p className="mt-4">
                Para soporte o dudas legales:{" "}
                <a
                  className="font-semibold text-blue-700 hover:underline"
                  href={`mailto:${SUPPORT_EMAIL}`}
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
