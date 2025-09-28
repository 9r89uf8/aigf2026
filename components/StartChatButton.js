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
      className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
      onClick={async () => {
        const { conversationId } = await start({ girlId });
        router.push(`/chat/${conversationId}`);
      }}
    >
      Message
    </button>
  );
}