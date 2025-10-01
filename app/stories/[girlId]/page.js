"use client";

import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import StoryViewer from "@/components/profile/StoryViewer";

export default function StoryViewerPage() {
  const { girlId } = useParams();
  const router = useRouter();
  const profileData = useQuery(api.girls.profilePage, { girlId });
  const signViewBatch = useAction(api.cdn.signViewBatch);
  const ensureConvo = useMutation(api.chat_home.ensureConversationAndMarkStoriesSeen);

  const [signedUrls, setSignedUrls] = useState({});
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [hasMarkedSeen, setHasMarkedSeen] = useState(false);

  // Sign all URLs in batch when profile data loads
  useEffect(() => {
    async function fetchSignedUrls() {
      if (!profileData?.keysToSign?.length) return;

      try {
        const { urls } = await signViewBatch({ keys: profileData.keysToSign });
        setSignedUrls(urls);
      } catch (error) {
        console.error("Failed to sign URLs:", error);
      }
    }

    fetchSignedUrls();
  }, [profileData, signViewBatch]);

  // Mark stories as seen when viewer opens
  useEffect(() => {
    async function markSeen() {
      if (!girlId || hasMarkedSeen) return;

      try {
        await ensureConvo({ girlId, at: Date.now() });
        setHasMarkedSeen(true);
      } catch (error) {
        console.error("Failed to mark stories seen:", error);
      }
    }

    markSeen();
  }, [girlId, ensureConvo, hasMarkedSeen]);

  // Loading state
  if (profileData === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white" />
      </div>
    );
  }

  // Girl not found or inactive
  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-2">Stories Not Found</h1>
          <p className="text-gray-400">This profile doesn't exist or is not available.</p>
        </div>
      </div>
    );
  }

  const { girl, stories } = profileData;

  // No stories available
  if (!stories?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-2">No Stories</h1>
          <p className="text-gray-400">{girl.name} hasn't posted any stories yet.</p>
          <button
            onClick={() => router.push("/chat")}
            className="mt-4 px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  const currentStory = stories[currentStoryIndex];
  const signedUrl = currentStory?.objectKey ? signedUrls[currentStory.objectKey] : undefined;

  function handleClose() {
    router.push("/chat");
  }

  function handleNext() {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      // Last story - close viewer
      handleClose();
    }
  }

  function handlePrev() {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  }

  async function handleSendMessage() {
    try {
      const { conversationId } = await ensureConvo({ girlId, at: Date.now() });
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }

  return (
    <div className="relative">
      <StoryViewer
        story={currentStory}
        signedUrl={signedUrl}
        onClose={handleClose}
        onNext={currentStoryIndex < stories.length - 1 ? handleNext : null}
        onPrev={currentStoryIndex > 0 ? handlePrev : null}
      />

      {/* Story progress indicator */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex gap-1 max-w-lg w-full px-4">
        {stories.map((_, i) => (
          <div
            key={i}
            className={`h-0.5 flex-1 rounded-full transition-colors ${
              i <= currentStoryIndex ? "bg-white" : "bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
