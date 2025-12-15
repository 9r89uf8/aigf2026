import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 pb-24 sm:pb-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
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
            <p className="text-sm font-semibold text-gray-900">Producto</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/girls" className="text-gray-600 hover:text-gray-900 hover:underline">
                  Explorar chicas IA
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
                <Link href="/plans" className="text-gray-600 hover:text-gray-900 hover:underline">
                  Planes
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
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900 hover:underline">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Términos
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

