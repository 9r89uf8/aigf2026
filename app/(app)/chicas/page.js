import GirlsClient from "./GirlsClient";
import { fetchPublicGirls } from "@/app/lib/convex-public";

export default async function ChicasListingPage() {
  const initialGirls = await fetchPublicGirls();
  return <GirlsClient initialGirls={initialGirls} />;
}
