//app/chat/page.js
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import StartChatButton from "@/components/StartChatButton";

export default function ThreadsPage() {
  const threads = useQuery(api.chat.getThreads) || [];

  return (
    <div className="max-w-screen-sm mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Chats</h1>
      <ul className="divide-y">
        {threads.map(t => (
          <li key={t.conversationId} className="py-3">
            <Link href={`/chat/${t.conversationId}`} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.girlName}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(t.lastMessageAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 line-clamp-1">
                  {t.lastMessagePreview || "Say hi 👋"}
                </div>
              </div>
              {t.unread && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                <StartChatButton girlId={t.conversationId}/>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}