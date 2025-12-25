import PlansClient from "./PlansClient";
import { fetchPublicPlans } from "@/app/lib/convex-public";

export default async function PlansPage() {
  const initialPlans = await fetchPublicPlans();
  return <PlansClient initialPlans={initialPlans} />;
}
