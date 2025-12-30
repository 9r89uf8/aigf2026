import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import Providers from "@/app/providers";
import AppShell from "@/components/AppShell";

export default function AppLayout({ children }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <Providers>
        <AppShell>{children}</AppShell>
      </Providers>
    </ConvexAuthNextjsServerProvider>
  );
}
