import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import Providers from "@/app/providers";
import { PublicNavbar } from "@/components/PublicNavbar";
import { SiteFooter } from "@/components/SiteFooter";

export default function PublicLayout({ children }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <PublicNavbar />
      <Providers>
        <div className="flex-1 min-h-0">{children}</div>
      </Providers>
      <SiteFooter />
    </ConvexAuthNextjsServerProvider>
  );
}
