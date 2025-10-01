`router.back()` depends on the browser history stack, so it’s not deterministic when the user arrived at `/stories/[girlId]` from different places (or opened it directly). The simplest, low‑overhead fix is to **encode the intended return path in the URL** and use that when closing.

### 1) Pass `returnTo` when linking to the story viewer

**From `/chat` stories rail:**

```diff
- href={`/stories/${s.girlId}`}
+ href={`/stories/${s.girlId}?returnTo=/chat`}
```

**From `/girls` listing (avatar ring):**

```diff
- <Link href={`/stories/${girl._id}`} ...
+ <Link href={`/stories/${girl._id}?returnTo=/girls`} ...
```

*(If you ever open the viewer from a girl profile, pass `?returnTo=/girls/${girl._id}` there too.)*

---

### 2) Read `returnTo` inside the story viewer and use it on close

**app/stories/[girlId]/page.js** — replace your `handleClose` + “No Stories” button target and add `useSearchParams`:

```diff
"use client";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
-import { useParams, useRouter } from "next/navigation";
+import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import StoryViewer from "@/components/profile/StoryViewer";

export default function StoryViewerPage() {
  const { girlId } = useParams();
  const router = useRouter();
+ const searchParams = useSearchParams();
+ const returnToParam = searchParams.get("returnTo");
+ // Guard against open redirects; only allow same-origin paths:
+ const returnTo = returnToParam && returnToParam.startsWith("/") ? returnToParam : "/chat";

  const profileData = useQuery(api.girls.profilePage, { girlId });
  const signViewBatch = useAction(api.cdn.signViewBatch);
  const ensureConvo = useMutation(api.chat_home.ensureConversationAndMarkStoriesSeen);

  const [signedUrls, setSignedUrls] = useState({});
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [hasMarkedSeen, setHasMarkedSeen] = useState(false);

  // ... (unchanged signing + markSeen effects)

  // Loading & not-found UI ... (unchanged until the button)

  // No stories available
  if (!stories?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-2">No Stories</h1>
          <p className="text-gray-400">{girl.name} hasn't posted any stories yet.</p>
          <button
-           onClick={() => router.push("/chat")}
+           onClick={() => router.push(returnTo)}
            className="mt-4 px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors"
          >
-           Back to Messages
+           Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentStory = stories[currentStoryIndex];
  const signedUrl = currentStory?.objectKey ? signedUrls[currentStory.objectKey] : undefined;

  function handleClose() {
-   router.back();
+   router.push(returnTo);
  }

  function handleNext() {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      // Last story - close viewer
      handleClose();
    }
  }

  // ... (rest unchanged)
}
```

> This keeps behavior predictable:
> • From **/girls** → close returns to **/girls**
> • From **/chat** → close returns to **/chat**
> • Direct link (no `returnTo`) → close falls back to **/chat**

---

### Why this works (and stays simple)

* Zero extra DB calls.
* Only a tiny query‑string param and a small change to `handleClose`.
* No reliance on browser history order, so it’s consistent across tabs, refreshes, and deep links.

If you prefer not to add a new history entry when closing, you can use `router.replace(returnTo)` instead of `push`.
