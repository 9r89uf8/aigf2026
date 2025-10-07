"use client";
//components/StartChatButton.js
import { useMutation, useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

export default function StartChatButton({
                                            girlId,
                                            premiumOnly = false,
                                            viewerPremium: viewerPremiumProp, // optional: pass from parent to avoid extra query
                                            className = "",
                                            label = "Mensaje",
                                        }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated } = useConvexAuth();
    const start = useMutation(api.chat.startConversation);
    const refreshPremium = useMutation(api.payments.refreshAndGetPremiumStatus);

    // Fallback to querying if parent didn't provide it
    const premiumStatus = useQuery(api.payments.getPremiumStatus);
    const viewerPremium = useMemo(
        () => (viewerPremiumProp ?? !!premiumStatus?.active),
        [viewerPremiumProp, premiumStatus?.active]
    );

    const handleClick = async () => {
        // Premium-only flow: unregistered users go straight to /plans
        if (premiumOnly && !isAuthenticated) {
          const ret = pathname || "/girls";
          router.push(`/plans?returnTo=${encodeURIComponent(ret)}&girl=${girlId}`);
          return;
        }

        // Premium-only & signed-in: do a fresh server-side check
        if (premiumOnly && isAuthenticated) {
            try {
                const fresh = await refreshPremium({});
                if (!fresh?.active) {
                    const ret = pathname || "/girls";
                    router.push(`/plans?returnTo=${encodeURIComponent(ret)}&girl=${girlId}`);
                    return;
                }
        } catch {
                // Fail-open: proceed, server-side guard in startConversation will re-check
                }
        }

        // Otherwise proceed (still requires auth for any chat)
        if (!isAuthenticated) {
            // Non-premium girl path can still require sign-in
            router.push(`/signin?returnTo=${encodeURIComponent(pathname || "/girls")}`);
            return;
        }

        try {
            const { conversationId } = await start({ girlId });
            router.push(`/chat/${conversationId}`);
        } catch (err) {
            // Server-side guard (in case UI was bypassed)
            if (String(err?.message || "").includes("PREMIUM_REQUIRED")) {
                const ret = pathname || "/girls";
                router.push(`/plans?returnTo=${encodeURIComponent(ret)}&girl=${girlId}`);
                return;
            }
            alert(err?.message ?? "No se pudo iniciar el chat");
        }
    };

    return (
        <button
            className={`flex-1 px-4 py-2 bg-white text-indigo-700 font-semibold text-center rounded-lg hover:bg-gray-100 transition-all shadow-md hover:shadow-lg ${className}`}
            onClick={handleClick}
        >
            {label}
        </button>
    );
}
