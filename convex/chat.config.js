// convex/chat.config.js
export const FREE_TEXT_PER_GIRL = 10;   // your free-quota policy
export const FREE_MEDIA_PER_GIRL = 2;   // future sections
export const FREE_AUDIO_PER_GIRL = 3;   // future sections
export const CONTEXT_TURNS = 8;         // AI context window

// --- Permit knobs (tune as you see fit) ---
export const PERMIT_USES_FREE = 5;              // uses per mint (free users)
export const PERMIT_TTL_MS_FREE = 2 * 60 * 1000; // 2 minutes

export const PERMIT_USES_PREMIUM = 50;               // optional better UX
export const PERMIT_TTL_MS_PREMIUM = 10 * 60 * 1000; // 10 minutes