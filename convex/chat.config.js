// convex/chat.config.js
export const FREE_TEXT_PER_GIRL = 10;   // your free-quota policy
export const FREE_MEDIA_PER_GIRL = 2;   // image/video quota
export const FREE_AUDIO_PER_GIRL = 3;   // voice notes quota
export const CONTEXT_TURNS = 8;         // AI context window

// --- Permit knobs (tune as you see fit) ---
export const PERMIT_USES_FREE = 5;              // uses per mint (free users)
export const PERMIT_TTL_MS_FREE = 2 * 60 * 1000; // 2 minutes

export const PERMIT_USES_PREMIUM = 50;               // optional better UX
export const PERMIT_TTL_MS_PREMIUM = 10 * 60 * 1000; // 10 minutes

// --- Audio limits ---
export const MAX_AUDIO_BYTES = 2 * 1024 * 1024; // 2MB
export const AUDIO_MIME_TYPES = ["audio/webm", "audio/mpeg", "audio/mp3", "audio/wav"];

// --- TTS settings ---
export const TTS_AUDIO_MIME = "audio/mpeg"; // mp3 output from ElevenLabs

// --- Heavy reply throttle ---
export const HEAVY_REPLY_COOLDOWN_MS = 45 * 1000; // 45s cooldown after media/audio replies