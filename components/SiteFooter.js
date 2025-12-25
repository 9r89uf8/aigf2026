import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 pb-24 sm:pb-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="text-lg font-bold tracking-tight text-gray-900">
              NoviaChat
            </Link>
            <p className="mt-3 text-sm text-gray-600">
              Servicio de entretenimiento con personajes impulsados por IA. No es un servicio de
              citas ni una persona real.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">Hubs</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/chicas-virtuales"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Chicas virtuales
                </Link>
              </li>
              <li>
                <Link
                  href="/chat-novia-virtual"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Chat novia virtual
                </Link>
              </li>
              <li>
                <Link
                  href="/novia-virtual"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Novia virtual
                </Link>
              </li>
              <li>
                <Link
                  href="/novia-virtual-gratis"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Novia virtual gratis
                </Link>
              </li>
              <li>
                <Link href="/novia-ia" className="text-gray-600 hover:text-gray-900 hover:underline">
                  Novia IA
                </Link>
              </li>
              <li>
                <Link href="/planes" className="text-gray-600 hover:text-gray-900 hover:underline">
                  Planes
                </Link>
              </li>
              <li>
                <Link
                  href="/noviachat-en-1-minuto"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  NoviaChat en 1 minuto
                </Link>
              </li>
              <li>
                <Link
                  href="/como-funciona"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Como funciona
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">Guias</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/guias/que-es-una-novia-virtual"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Que es una novia virtual
                </Link>
              </li>
              <li>
                <Link
                  href="/guias/chat-novia-virtual-consejos"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Consejos para conversar
                </Link>
              </li>
              <li>
                <Link
                  href="/guias/novia-virtual-gratis-que-incluye"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Que incluye gratis
                </Link>
              </li>
              <li>
                <Link
                  href="/guias/ideas-de-conversacion"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Ideas de conversacion
                </Link>
              </li>
              <li>
                <Link
                  href="/guias/seguridad-privacidad-chats-ia"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Seguridad y privacidad
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">Ayuda y legal</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/support" className="text-gray-600 hover:text-gray-900 hover:underline">
                  Soporte
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidad-seguridad"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Privacidad y seguridad
                </Link>
              </li>
              <li>
                <Link
                  href="/centro-de-seguridad"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Centro de seguridad
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900 hover:underline">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Terminos
                </Link>
              </li>
              <li>
                <Link
                  href="/preguntas-frecuentes"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Preguntas frecuentes
                </Link>
              </li>
              <li>
                <Link
                  href="/sobre-noviachat"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Sobre NoviaChat
                </Link>
              </li>
              <li>
                <Link
                  href="/prensa"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Prensa y media kit
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-gray-200 pt-6 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} NoviaChat. Todos los derechos reservados.</p>
          <p className="text-gray-500">Contacto: soporte y políticas disponibles arriba.</p>
        </div>
      </div>
    </footer>
  );
}
