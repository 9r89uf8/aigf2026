"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { SiteFooter } from "@/components/SiteFooter";

export default function AppShell({ children }) {
  const pathname = usePathname() || "/";
  const hideFooter = pathname.startsWith("/chat");

  return (
    <>
      <Navbar />
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      {!hideFooter && <SiteFooter />}
      <BottomNav />
    </>
  );
}
