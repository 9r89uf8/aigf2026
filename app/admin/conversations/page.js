"use client";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function AdminConversationsListPage() {
  const conversations = useQuery(api.chat.listRecentConversationsAdmin, { limit: 10 });

  const items = useMemo(() => conversations || [], [conversations]);

  if (!conversations) {
    return <div className="p-6">Cargando conversaciones…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Conversaciones recientes</h1>
        </div>
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500 text-lg">No hay conversaciones disponibles todavía.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Conversaciones recientes</h1>
        <p className="text-sm text-gray-500">Mostrando las últimas {items.length} conversaciones actualizadas</p>
      </div>

      <div className="bg-white border rounded-lg divide-y">
        {items.map((item, index) => (
          <Link
            key={item.conversationId}
            href={`/admin/conversations/${item.conversationId}?index=${index}`}
            className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 truncate">
                  {item.userEmail || "Usuario sin correo"}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                  {item.girlName}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">
                {item.lastMessagePreview || "Sin vista previa"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 text-right flex-shrink-0">
              <span className="text-xs text-gray-400">
                {new Date(item.lastMessageAt || item.updatedAt).toLocaleString()}
              </span>
              <span className="text-[11px] uppercase tracking-wide text-gray-400">
                ID: {String(item.conversationId).slice(-6)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
