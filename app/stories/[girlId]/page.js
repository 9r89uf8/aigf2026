"use client";
// app/stories/[girlId]/page.js
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react"; // ⬅️ removed useMemo import
import StoryViewer from "@/components/profile/StoryViewer";

export default function StoryViewerPage() {
  const { girlId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToParam = searchParams.get("returnTo");
  const returnTo = returnToParam && returnToParam.startsWith("/") ? returnToParam : "/chat";

  const profileData = useQuery(api.girls.profilePage, { girlId });
  const signViewBatch = useAction(api.cdn.signViewBatch);
  const ensureConvo = useMutation(api.chat_home.ensureConversationAndMarkStoriesSeen);

  const [signedUrls, setSignedUrls] = useState({});
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [hasMarkedSeen, setHasMarkedSeen] = useState(false);

  // Sign all URLs in batch when profile data loads
  useEffect(() => {
    async function fetchSignedUrls() {
      const keys = profileData?.keysToSign ?? [];
      if (!keys.length) return;
      try {
        const { urls } = await signViewBatch({ keys });
        setSignedUrls(urls || {});
      } catch (error) {
        console.error("Failed to sign URLs:", error);
      }
    }
    fetchSignedUrls();
  }, [profileData?.keysToSign, signViewBatch]);

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
                onClick={() => router.push(returnTo)}
                className="mt-4 px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
    );
  }

  const getSigned = (s) => (s?.objectKey ? signedUrls[s.objectKey] : undefined);

  const currentStoryRaw = stories[currentStoryIndex];
  const signedUrl = getSigned(currentStoryRaw);

  // ⬇️ IMPORTANT: build viewerStory WITHOUT useMemo (no hook after the early returns)
  const viewerStory = currentStoryRaw
      ? {
        ...currentStoryRaw,
        user: {
          name: girl?.name,
          avatarUrl: girl?.avatarKey ? signedUrls[girl.avatarKey] : undefined,
        },
      }
      : null;

  const prevUrl =
      currentStoryIndex > 0 && stories[currentStoryIndex - 1]?.kind === "image"
          ? getSigned(stories[currentStoryIndex - 1])
          : null;

  const nextUrl =
      currentStoryIndex < stories.length - 1 && stories[currentStoryIndex + 1]?.kind === "image"
          ? getSigned(stories[currentStoryIndex + 1])
          : null;

  function handleClose() {
    router.push(returnTo);
  }

  function handleNext() {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex((n) => n + 1);
    } else {
      handleClose(); // close on last story
    }
  }

  function handlePrev() {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((n) => n - 1);
    }
  }

  const canPrev = currentStoryIndex > 0;
  const canNext = currentStoryIndex < stories.length - 1;

  return (
      <StoryViewer
          story={viewerStory}
          signedUrl={signedUrl}
          onClose={handleClose}
          onNext={handleNext}          // always passed so auto-advance can close on last
          onPrev={handlePrev}          // always passed
          currentIndex={currentStoryIndex}
          totalCount={stories.length}
          nextUrl={nextUrl}
          prevUrl={prevUrl}
          canPrev={canPrev}            // only affects arrow visibility
          canNext={canNext}
          autoAdvance
          imageDurationMs={5000}
          textDurationMs={5000}
      />
  );
}

