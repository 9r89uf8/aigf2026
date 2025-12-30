import { MarketingHeader } from "@/components/MarketingHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function MarketingLayout({ children }) {
  return (
    <>
      <MarketingHeader />
      <div className="flex-1 min-h-0">{children}</div>
      <SiteFooter />
    </>
  );
}
