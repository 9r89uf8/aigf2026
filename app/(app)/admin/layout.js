// app/admin/layout.js
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@/convex/_generated/api";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // ensure cookies are read each request

export default async function AdminLayout({ children }) {
  const token = await convexAuthNextjsToken();
  if (!token) redirect("/signin"); // shouldn't happen if middleware gates auth

  // ✅ attach the token so the query is authenticated on the server
  const me = await fetchQuery(api.users.getMe, {}, { token });
  if (me?.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="border-r bg-gray-50 p-4">
        <nav className="flex flex-col gap-2 text-sm">
          <h2 className="font-semibold text-lg mb-4">Admin Panel</h2>
          <a
            href="/admin/conversations"
            className="p-2 rounded hover:bg-gray-100 transition-colors"
          >
            Conversations
          </a>
          <a
            href="/admin/girls"
            className="p-2 rounded hover:bg-gray-100 transition-colors"
          >
            Girls
          </a>
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
