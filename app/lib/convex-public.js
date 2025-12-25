import "server-only";

import { fetchAction, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

function getConvexUrl() {
  return process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || null;
}

export async function fetchPublicPlans() {
  const url = getConvexUrl();
  if (!url) return [];
  try {
    return await fetchAction(api.payments_actions.listPlansCached, {}, { url });
  } catch (error) {
    console.error("fetchPublicPlans failed", error);
    return [];
  }
}

export async function fetchPublicGirls() {
  const url = getConvexUrl();
  if (!url) return [];
  try {
    return await fetchQuery(api.girls.listGirlsPublic, {}, { url });
  } catch (error) {
    console.error("fetchPublicGirls failed", error);
    return [];
  }
}
