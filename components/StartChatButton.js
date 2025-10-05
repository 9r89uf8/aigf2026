// components/StartChatButton.js
"use client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function StartChatButton({ girlId }) {
  const router = useRouter();
  const start = useMutation(api.chat.startConversation);
  return (
    <button
      className="flex-1 px-4 py-2 bg-white text-indigo-700 font-semibold text-center rounded-lg hover:bg-gray-100 transition-all shadow-md hover:shadow-lg"
      onClick={async () => {
        const { conversationId } = await start({ girlId });
        router.push(`/chat/${conversationId}`);
      }}
    >
        Mensaje
    </button>
  );
}