// convex/_utils/auth.js
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "../_generated/api";

export async function assertAdmin(ctx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthenticated");

  // Queries/Mutations path (ctx.db is present)
  if (ctx.db?.query) {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .unique();
    if (!profile || profile.role !== "admin") throw new Error("Forbidden");
    return { userId, profile };
  }

  // Actions path (no ctx.db): ask a query to do the DB read
  if (ctx.runQuery) {
    const me = await ctx.runQuery(api.users.getMe, {});
    if (!me || me.role !== "admin") throw new Error("Forbidden");
    return { userId, profile: { role: me.role } };
  }

  throw new Error("Unsupported server context");
}