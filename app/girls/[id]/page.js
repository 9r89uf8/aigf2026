"use client";

import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import ProfileHero from "@/components/profile/ProfileHero";
import MediaCard from "@/components/profile/MediaCard";
import LockedMediaCard from "@/components/profile/LockedMediaCard";
import StoryChip from "@/components/profile/StoryChip";
import StoryViewer from "@/components/profile/StoryViewer";

export default function GirlProfilePage() {
  const { id } = useParams();
  const profileData = useQuery(api.girls.profilePage, { girlId: id });
  const signViewBatch = useAction(api.cdn.signViewBatch);
  const toggleLike = useMutation(api.girls.toggleLike);

  const [signedUrls, setSignedUrls] = useState({});
  const [activeTab, setActiveTab] = useState("gallery"); // "gallery" | "posts"
  const [viewingStory, setViewingStory] = useState(null); // holds the selected story object

  // Sign all URLs in batch when profile data loads
  useEffect(() => {
    async function fetchSignedUrls() {
      if (!profileData?.keysToSign?.length) return;
      try {
        const { urls } = await signViewBatch({ keys: profileData.keysToSign });
        setSignedUrls(urls || {});
      } catch (error) {
        console.error("Failed to sign URLs:", error);
      }
    }
    fetchSignedUrls();
  }, [profileData?.keysToSign, signViewBatch]);

  // Loading state
  if (profileData === undefined) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600" />
        </div>
    );
  }

  // Girl not found or inactive
  if (!profileData) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Perfil No Encontrado</h1>
            <p className="text-gray-600">Este perfil no existe o no está disponible.</p>
          </div>
        </div>
    );
  }

  const { girl, viewer, stories, gallery, posts } = profileData;

  async function handleLikeToggle(mediaId) {
    try {
      return await toggleLike({ mediaId });
    } catch (error) {
      console.error("Like toggle failed:", error);
      throw error;
    }
  }

  function handleStoryClick(story) {
    setViewingStory(story);
  }

  // --- Viewer wiring (index, neighbors, user injection) --------------------
  const currentStoryIndex = viewingStory
      ? stories.findIndex((s) => s.id === viewingStory.id)
      : -1;

  const signedUrlForViewer =
      viewingStory?.objectKey ? signedUrls[viewingStory.objectKey] : null;

  function handleStoryNext() {
    if (currentStoryIndex === -1) return;
    if (currentStoryIndex < stories.length - 1) {
      setViewingStory(stories[currentStoryIndex + 1]);
    } else {
      // Last story: close viewer so auto-advance/video-end behaves like IG
      setViewingStory(null);
    }
  }

  function handleStoryPrev() {
    if (currentStoryIndex > 0) {
      setViewingStory(stories[currentStoryIndex - 1]);
    }
  }

  const prevUrl =
      currentStoryIndex > 0 &&
      stories[currentStoryIndex - 1]?.kind === "image" &&
      stories[currentStoryIndex - 1]?.objectKey
          ? signedUrls[stories[currentStoryIndex - 1].objectKey]
          : null;

  const nextUrl =
      currentStoryIndex >= 0 &&
      currentStoryIndex < stories.length - 1 &&
      stories[currentStoryIndex + 1]?.kind === "image" &&
      stories[currentStoryIndex + 1]?.objectKey
          ? signedUrls[stories[currentStoryIndex + 1].objectKey]
          : null;

  // Inject user info so StoryViewer shows avatar & name in the top bar
  const viewerStory = viewingStory
      ? {
        ...viewingStory,
        user: {
          name: girl?.name,
          avatarUrl: girl?.avatarKey ? signedUrls[girl.avatarKey] : undefined,
        },
      }
      : null;

  const canPrev = currentStoryIndex > 0;
  const canNext = currentStoryIndex >= 0 && currentStoryIndex < stories.length - 1;

  return (
      <div className="min-h-screen">
        {/* Hero Section */}
        <ProfileHero
            girl={girl}
            backgroundUrl={girl.backgroundKey ? signedUrls[girl.backgroundKey] : null}
            avatarUrl={girl.avatarKey ? signedUrls[girl.avatarKey] : null}
        />

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
          {/* Stories Strip */}
          {stories.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Historias</h2>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {stories.map((story) => (
                      <StoryChip
                          key={story.id}
                          story={story}
                          signedUrl={story.objectKey ? signedUrls[story.objectKey] : null}
                          onClick={handleStoryClick}
                      />
                  ))}
                </div>
              </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex gap-8">
                <button
                    onClick={() => setActiveTab("gallery")}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === "gallery"
                            ? "border-purple-600 text-purple-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  Galería ({gallery.length})
                </button>
                <button
                    onClick={() => setActiveTab("posts")}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === "posts"
                            ? "border-purple-600 text-purple-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  Publicaciones ({posts.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Gallery Tab */}
          {activeTab === "gallery" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gallery.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <p className="text-gray-500">Aún no hay elementos en la galería.</p>
                    </div>
                ) : (
                    gallery.map((item) => {
                      const isLocked = item.premiumOnly && !item.objectKey;
                      const isLiked = viewer.likedIds.includes(item.id);

                      return isLocked ? (
                          <LockedMediaCard key={item.id} media={item} />
                      ) : (
                          <MediaCard
                              key={item.id}
                              media={item}
                              signedUrl={item.objectKey ? signedUrls[item.objectKey] : null}
                              isLiked={isLiked}
                              onLikeToggle={handleLikeToggle}
                          />
                      );
                    })
                )}
              </div>
          )}

          {/* Posts Tab */}
          {activeTab === "posts" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <p className="text-gray-500">Aún no hay publicaciones.</p>
                    </div>
                ) : (
                    posts.map((item) => {
                      const isLiked = viewer.likedIds.includes(item.id);

                      return (
                          <MediaCard
                              key={item.id}
                              media={item}
                              signedUrl={item.objectKey ? signedUrls[item.objectKey] : null}
                              isLiked={isLiked}
                              onLikeToggle={handleLikeToggle}
                          />
                      );
                    })
                )}
              </div>
          )}
        </div>

        {/* Story Viewer Modal */}
        {viewingStory && currentStoryIndex !== -1 && (
            <StoryViewer
                story={viewerStory}
                signedUrl={signedUrlForViewer}
                onClose={() => setViewingStory(null)}
                onNext={handleStoryNext}
                onPrev={handleStoryPrev}
                currentIndex={currentStoryIndex}
                totalCount={stories.length}
                nextUrl={nextUrl}
                prevUrl={prevUrl}
                canPrev={canPrev}
                canNext={canNext}
                autoAdvance
                imageDurationMs={5000}
                textDurationMs={5000}
            />
        )}
      </div>
  );
}
