import Link from "next/link";

export const metadata = {
  title: { absolute: "Soporte | NoviaChat" },
  description:
    "Ayuda y soporte de NoviaChat: preguntas frecuentes, pagos, restablecer contraseña y contacto.",
  robots: "index, follow",
  alternates: { canonical: "/support" },
};

const SUPPORT_EMAIL = "support@noviachat.com";

export default function SupportPage() {
  return (
    <main className="font-sans bg-white text-gray-900">
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-6 inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Centro de ayuda
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Soporte</h1>
          <p className="mt-4 text-lg text-gray-600">
            Aquí tienes respuestas rápidas y la mejor forma de contactarnos si algo no funciona.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/reset-password"
              className="rounded-2xl border border-gray-200 bg-white p-5 hover:bg-gray-50"
            >
              <p className="text-sm font-semibold text-gray-900">Restablecer contraseña</p>
              <p className="mt-1 text-sm text-gray-600">Recupera acceso a tu cuenta.</p>
            </Link>
            <Link
              href="/account"
              className="rounded-2xl border border-gray-200 bg-white p-5 hover:bg-gray-50"
            >
              <p className="text-sm font-semibold text-gray-900">Mi cuenta</p>
              <p className="mt-1 text-sm text-gray-600">Perfil, ajustes y estado.</p>
            </Link>
            <Link
              href="/plans"
              className="rounded-2xl border border-gray-200 bg-white p-5 hover:bg-gray-50"
            >
              <p className="text-sm font-semibold text-gray-900">Planes</p>
              <p className="mt-1 text-sm text-gray-600">Precios y acceso premium.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-14 md:pb-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <h2 className="text-2xl font-semibold">Contacto</h2>
              <p className="mt-3 text-gray-700">
                Para soporte técnico, pagos o dudas sobre tu cuenta, escríbenos a:
              </p>
              <p className="mt-4">
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="inline-flex items-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black"
                >
                  {SUPPORT_EMAIL}
                </a>
              </p>
              <p className="mt-4 text-sm text-gray-600">
                Incluye el correo de tu cuenta y una breve descripción. Si es un tema de pago,
                agrega la fecha aproximada y el plan.
              </p>
            </div>

            <div className="rounded-3xl bg-gray-50 p-6 ring-1 ring-gray-200">
              <h2 className="text-2xl font-semibold">Preguntas frecuentes</h2>
              <div className="mt-5 space-y-3">
                <details className="rounded-2xl border border-gray-200 bg-white p-5">
                  <summary className="cursor-pointer text-base font-semibold text-gray-900">
                    No puedo iniciar sesión
                  </summary>
                  <p className="mt-3 text-sm text-gray-700">
                    Verifica tu correo y usa{" "}
                    <Link href="/reset-password" className="font-semibold text-blue-700 hover:underline">
                      restablecer contraseña
                    </Link>
                    . Si el problema continúa, contáctanos por email.
                  </p>
                </details>
                <details className="rounded-2xl border border-gray-200 bg-white p-5">
                  <summary className="cursor-pointer text-base font-semibold text-gray-900">
                    Problemas con el pago o premium
                  </summary>
                  <p className="mt-3 text-sm text-gray-700">
                    Los pagos se procesan con Stripe. Si el premium no se activa, envíanos el correo
                    de tu cuenta y la fecha/hora aproximada del pago para revisarlo.
                  </p>
                </details>
                <details className="rounded-2xl border border-gray-200 bg-white p-5">
                  <summary className="cursor-pointer text-base font-semibold text-gray-900">
                    Quiero eliminar mi cuenta o mis datos
                  </summary>
                  <p className="mt-3 text-sm text-gray-700">
                    Escríbenos a <span className="font-semibold">{SUPPORT_EMAIL}</span> con el asunto
                    “Eliminar cuenta” y el correo asociado. Te guiaremos con el proceso.
                  </p>
                </details>
                <details className="rounded-2xl border border-gray-200 bg-white p-5">
                  <summary className="cursor-pointer text-base font-semibold text-gray-900">
                    ¿Dónde leo privacidad y términos?
                  </summary>
                  <p className="mt-3 text-sm text-gray-700">
                    Puedes consultar{" "}
                    <Link href="/privacy" className="font-semibold text-blue-700 hover:underline">
                      Privacidad
                    </Link>{" "}
                    y{" "}
                    <Link href="/terminos" className="font-semibold text-blue-700 hover:underline">
                      Términos
                    </Link>
                    .
                  </p>
                </details>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-gray-200 bg-white p-6">
            <h2 className="text-2xl font-semibold">Consejo rápido</h2>
            <p className="mt-3 text-gray-700">
              Si ves una pantalla en blanco o algo raro, prueba recargar la página, cerrar sesión y
              volver a entrar. Si usas un bloqueador de scripts, puede interferir con el inicio de
              sesión o pagos.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

