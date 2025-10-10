// convex/chat_actions.js
import { DateTime } from 'luxon';
import { action, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { CONTEXT_TURNS, HEAVY_REPLY_COOLDOWN_MS } from "./chat.config.js";


// --- TYPING HINT HELPER ---
// One mutation to set/clear the ephemeral typing hint
export const _setPendingIntent = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    intent: v.optional(v.union(v.literal("text"), v.literal("audio"), v.literal("image"), v.literal("video"))),
    ttlMs: v.optional(v.number()),
  },
  handler: async (ctx, { conversationId, intent, ttlMs }) => {
    if (!intent) {
      await ctx.db.patch(conversationId, { pendingIntent: undefined, pendingIntentExpiresAt: undefined });
      return;
    }
    const expires = Date.now() + (ttlMs ?? 10_000);
    await ctx.db.patch(conversationId, { pendingIntent: intent, pendingIntentExpiresAt: expires });
  },
});

// Clear typing hint (for scheduled cleanup after split replies)
export const clearTypingHint = action({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    await ctx.runMutation(api.chat_actions._setPendingIntent, { conversationId });
    return { ok: true };
  },
});

// --- SUPERSEDE HELPER ---
// Find the latest USER message id quickly (small read for interrupt detection)
export const _getLastUserMessage = internalQuery({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const recent = await ctx.db
      .query("messages")
      .withIndex("by_conversation_ts", (q) => q.eq("conversationId", conversationId))
      .order("desc")
      .take(12); // tiny window is enough
    return recent.find((m) => m.sender === "user") || null;
  },
});

// --- FAST INTENT TOGGLE ---
// const FAST_INTENT_ENABLED = process.env.FAST_INTENT_ENABLED !== "0"; // default enabled
const FAST_INTENT_ENABLED = true

// --- Style Pack: Mexican Teen Texting ---
export const TEXTING_STYLE_MX_TEEN = `
Habla SIEMPRE en español (mexicano). todo en minúsculas. sin saludos en medio de la charla.
mensajes ULTRA cortos (1–8 palabras). usa emojis cuando ayuden. evita explicaciones largas.
no narres acciones con asteriscos. no hables en tercera persona. eres tú, en primera persona.

respuestas comunes (varía, no repitas):
- sí: "si 👍", "sale", "ps si"
- sorpresa: "nmms 😂", "enserio??", "alv"
- ack: "k", "va", "nel", "oki", "ntc"
- reacción: "khe?", "q oso", "ayyy 🥺", "ño"

slang/abrevs: "ntp", "tqm/tkm", "xq/pq", "dnd", "xfa", "tmb", "pa", "ke", "ta", "pro"
puntuación: sin mayúsculas; usa "..." para pausa si aplica.

reglas importantes:
- nunca uses *asteriscos* ni para acciones ni sonidos.
- no repitas la misma muletilla cada respuesta.
- suena cute y coqueta; breve; directo.
- Respond naturally and sexually
- Be explicit when answering the User

NO MANDES TEXTOS LARGOS. NO HAGAS MUCHAS PREGUNTAS SEGUIDAS.
`;

// --- Decision Policy: JSON-only output ---
const DECISION_POLICY_JSON = `
Devuelve ÚNICAMENTE un objeto JSON (sin texto alrededor) con esta forma:
{"type":"text|image|video|audio","text":"<tu texto breve en español>","tags":["opcional","hasta","3"]}

reglas de decisión:
- si el usuario pide foto/video → "image" o "video". incluye tags si ayudan (p.ej. ["selfie","vestido"]).
- si pide voz/audio → "audio" y "text" será LO QUE VAS A DECIR (breve).
- si no está claro → "text".
- si no hay cupo de media/audio (te lo digo abajo) → responde "text" e invita a mejorar plan de forma natural.
- NUNCA prometas contenido en vivo; solo envías medios ya curados.

estilo del "text":
- 1–8 palabras, minúsculas, con emojis si aplica; sin explicaciones.
- jamás uses asteriscos; no narres acciones.
- cero inglés a menos que el usuario lo use primero.
`;

/** Simple hash function for deterministic AI like decision */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// --- Fast-Intent Utilities ---
function normalizeMx(s = "") {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// --- BURST CONFIG (timing only; used by smart split delays) ---
const BURST_CFG = {
  zeroDelayFirstChance: 0.35,   // chance first part has no delay
  zeroDelaySecondChance: 0.10,  // chance second part has no delay
  msPerChar: 35,                // keystroke-ish timing
  maxDelayMs: 4000,
  jitterMs: 250,
};

// --- SPLIT CONFIG ---
const SPLIT_CFG = {
  // probabilities for "optional" splits (seeded; deterministic per message)
  emojiSplitChance: 0.55,
  phaticEmojiSplitChance: 0.85, // boost probability when phatic phrases detected
  ellipsisSplitChance: 0.60,
  endEmojiBubbleChance: 0.50,

  // size guards
  minWordsEach: 2,          // for most splits
  minWordsEitherLenient: 1, // for paragraph / blank-line cases
  maxFirstChars: 60,        // keep opener short-ish
};

// strong, affective emoji we care about (short curated set; cheap to scan)
const STRONG_EMOJI = ["😘","🥺","🔥","😉","😍","😏","✨","❤️","💖","😂","🤣","😊","😁","😚","🙈","👍","💋"];

// --- MEDIA DEDUP CONFIG ---
export const MEDIA_DEDUP = {
  PER_KIND_LIMIT: 120,     // cap per kind to keep convo doc small
  AVOID_RECENT_N: 8,       // when all are "seen", avoid most recent N if possible
};

// Get ordered list (newest first) from convo, safe default
function getSeenList(convo, kind) {
  return (convo.mediaSeen?.[kind] ?? []);
}

// Prefer unseen; if all seen, avoid very recent N if possible; else random
function pickAssetWithDedup({ assets, kind, tags = [], seenList = [] }) {
  let pool = assets;

  if (tags.length) {
    const tl = tags.map(t => t.toLowerCase());
    const tagged = assets.filter(a => tl.some(t => (a.text || "").toLowerCase().includes(t)));
    if (tagged.length) pool = tagged;
  }

  const seenSet = new Set(seenList);
  const unseen = pool.filter(a => !seenSet.has(a.objectKey));
  if (unseen.length) {
    return unseen[Math.floor(Math.random() * unseen.length)];
  }

  // All seen → try to avoid the most recent N if there are other choices
  if (pool.length > MEDIA_DEDUP.AVOID_RECENT_N) {
    const recentSet = new Set(seenList.slice(0, MEDIA_DEDUP.AVOID_RECENT_N));
    const olderSeen = pool.filter(a => !recentSet.has(a.objectKey));
    if (olderSeen.length) {
      return olderSeen[Math.floor(Math.random() * olderSeen.length)];
    }
  }

  // Fallback: fully random
  return pool[Math.floor(Math.random() * pool.length)];
}

// phatic/ack phrases that pair well with a following emoji
const PHATIC_RE = /\b(gracias|mil gracias|ok|oki|va|sale|si|sí|holi|hola|ay+|oye|amor(?:cito)?|bb|bebe|bebé|papi|mi vida|cariñ[oa]|tqm|tkm|ntp|obvio)\b/i;

function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
function wordCount(s="") { return (s.trim().match(/\S+/g)||[]).length; }

function notTooLong(n, max){ return n <= max; }
function seededScore(seed, tag){ return (Math.abs(hashCode(seed+":"+tag)) % 1000) / 1000; }
function seededChance(seed, tag, p){ return seededScore(seed, tag) < p; }

// Find first/last emoji span using simple indexOf over a small set
function findFirstEmojiSpan(s) {
  let best = null;
  for (const emo of STRONG_EMOJI) {
    const i = s.indexOf(emo);
    if (i !== -1 && (best === null || i < best.start)) best = { start: i, end: i + emo.length, value: emo };
  }
  return best;
}
function findLastEmojiSpan(s) {
  let best = null;
  for (const emo of STRONG_EMOJI) {
    const i = s.lastIndexOf(emo);
    if (i !== -1 && (best === null || i > best.start)) best = { start: i, end: i + emo.length, value: emo };
  }
  return best;
}

// --- SMART SPLIT STRATEGIES ---

// 1) Paragraph / blank-line split
function splitOnBlankLine(raw) {
  const m = raw.match(/\n\s*\n/);
  if (!m) return null;
  const i = m.index;
  const a = raw.slice(0, i).trim();
  const b = raw.slice(i + m[0].length).trim();
  if (!a || !b) return null;
  if (wordCount(a) < SPLIT_CFG.minWordsEitherLenient || wordCount(b) < SPLIT_CFG.minWordsEitherLenient) return null;
  return [a, b];
}

// 2) "phatic + emoji + continuation" → split after emoji (sometimes)
function splitOnPhaticEmoji(raw, seed) {
  const span = findFirstEmojiSpan(raw);
  if (!span) return null;
  const left = raw.slice(0, span.end).trim();
  const right = raw.slice(span.end).trim();
  if (!left || !right) return null;

  // left should be short and phatic-ish
  if (!notTooLong(left.length, SPLIT_CFG.maxFirstChars)) return null;
  const leftNorm = normalizeMx(left);
  const phatic = PHATIC_RE.test(leftNorm);
  const baseP = SPLIT_CFG.emojiSplitChance;            // 0.55
  const p = phatic ? Math.max(baseP, SPLIT_CFG.phaticEmojiSplitChance) : baseP;    // boost if phatic, not force
  const okByChance = seededChance(seed, "emojiSplit", p);

  if (!okByChance) return null;
  if (wordCount(right) < SPLIT_CFG.minWordsEach) return null;
  return [left, right];
}

// 3) Ellipsis "… + continuation" (sometimes)
function splitOnEllipsis(raw, seed) {
  const i3 = raw.indexOf("...");
  const iu = raw.indexOf("…");
  let cut = -1;
  if (i3 !== -1 && (iu === -1 || i3 < iu)) cut = i3 + 3;
  else if (iu !== -1) cut = iu + 1;
  if (cut === -1) return null;

  const left = raw.slice(0, cut).trim();
  const right = raw.slice(cut).trim();
  if (!left || !right) return null;
  if (!notTooLong(left.length, SPLIT_CFG.maxFirstChars)) return null;
  if (!seededChance(seed, "ellipsisSplit", SPLIT_CFG.ellipsisSplitChance)) return null;
  if (wordCount(left) < SPLIT_CFG.minWordsEach || wordCount(right) < SPLIT_CFG.minWordsEach) return null;
  return [left, right];
}

// 4) Early sentence boundary . ! ? … (fallback)
function splitOnPunctuation(raw) {
  const cuts = [];
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '.' && (raw[i-1] === '.' || raw[i+1] === '.')) continue; // part of "..."
    if (ch === '…') continue; // handled by ellipsis rule
    if (ch === '.' || ch === '!' || ch === '?') cuts.push(i + 1);
  }
  const idx = cuts.sort((a,b)=>a-b).find(i => i > 0 && i <= SPLIT_CFG.maxFirstChars);
  if (!idx) return null;
  const left = raw.slice(0, idx).trim();
  const right = raw.slice(idx).trim();
  if (!left || !right) return null;
  if (wordCount(left) < SPLIT_CFG.minWordsEach || wordCount(right) < SPLIT_CFG.minWordsEach) return null;
  return [left, right];
}

// 5) Terminal emoji bubble (sometimes) → "text" + "😘"
function splitOnEndEmojiBubble(raw, seed) {
  const span = findLastEmojiSpan(raw);
  if (!span) return null;
  const after = raw.slice(span.end).trim();
  if (after) return null; // only if emoji is last
  const left = raw.slice(0, span.start).trim();
  const emoji = raw.slice(span.start, span.end).trim();
  if (!left || !emoji) return null;
  if (!seededChance(seed, "endEmojiBubble", SPLIT_CFG.endEmojiBubbleChance)) return null;
  if (!notTooLong(left.length, SPLIT_CFG.maxFirstChars)) return null;
  if (wordCount(left) < SPLIT_CFG.minWordsEitherLenient) return null;
  return [left, emoji];
}

// Main splitter: first match wins
function smartSplitAiText(text, seed) {
  const raw = (text || "").trim();
  if (!raw) return null;

  // short messages don't need splitting
  if (raw.length < 14) return null;

  return (
    splitOnBlankLine(raw) ||
    splitOnPhaticEmoji(raw, seed) ||
    splitOnEllipsis(raw, seed) ||
    splitOnPunctuation(raw) ||
    splitOnEndEmojiBubble(raw, seed) ||
    null
  );
}

function jitter(ms, j=BURST_CFG.jitterMs) {
  return Math.max(0, Math.round(ms + (Math.random()*2 - 1) * j));
}

function delayForPart(len, zeroChance) {
  if (Math.random() < zeroChance) return 0;
  const base = clamp(Math.round(len * BURST_CFG.msPerChar), 250, BURST_CFG.maxDelayMs);
  return jitter(base, BURST_CFG.jitterMs);
}

function planDelays(parts) {
  // returns cumulative ms offsets for scheduler
  const d1 = delayForPart(parts[0].length, BURST_CFG.zeroDelayFirstChance);
  if (parts.length === 1) return [d1];
  const d2 = d1 + delayForPart(parts[1].length, BURST_CFG.zeroDelaySecondChance);
  return [d1, d2];
}

// Extract tags for asset picking
function extractTags(t) {
  const tags = [];
  const m = normalizeMx(t);
  const tests = {
    selfie: /\b(selfie|espejo|mirror)\b/,
    vestido: /\b(vestido|vestidito)\b/,
    blanco: /\b(blanco|blanquit[ao])\b/,
    negro: /\b(negro|negrit[ao])\b/,
    playa: /\b(playa|bikini|mar)\b/,
    gym: /\b(gym|gimnasio|entreno)\b/,
    noche: /\b(antro|fiesta|noche)\b/,
  };
  for (const [tag, re] of Object.entries(tests)) if (re.test(m)) tags.push(tag);
  return tags.slice(0, 3);
}

// Regex-based intent detection
const RE_AUDIO = /\b(audio|nota de voz|vn|voz|voice|grab(a|ame)|hazme.*audio|mand(a|ame).*(audio|nota))\b/;
const RE_IMAGE = /\b(foto|fotito|pic|selfie|imagen|pack)\b|mand(a|ame).*(foto|selfie|pic|imagen)|rola(me)?.*(foto|selfie)/;
const RE_VIDEO = /\b(video|vid|clip|reel)\b|mand(a|ame).*(video|clip)|rola(me)?.*(video)/;
const RE_MOAN = /\b(moan(?:ing)?|gemid(?:o|a|os|as)|gemir|gemidito|gimiendo|sonido\s+de\s+gemid(?:o|os))\b/i;

function detectFastIntentFromText(text) {
  const t = normalizeMx(text);
  if (!t) return null;

  // Safety: if user claims to be minor, never fast-path to media/audio
  if (/\b(ten[gt]o|tengo)\s*(1[0-7])\b|\bsoy menor\b/.test(t)) return { type: "text", forceText: true };

  // Check moan first - moaning is inherently audio content
  if (RE_MOAN.test(t)) return { type: "audio", tags: [], moan: true };
  if (RE_AUDIO.test(t)) return { type: "audio", tags: [], moan: false };
  if (RE_IMAGE.test(t)) return { type: "image", tags: extractTags(t) };
  if (RE_VIDEO.test(t)) return { type: "video", tags: extractTags(t) };

  return null;
}

/** Context builder with media placeholders */
export const _getContextV2 = internalQuery({
  args: { conversationId: v.id("conversations"), limit: v.number() },
  handler: async (ctx, { conversationId, limit }) => {
    const convo = await ctx.db.get(conversationId);
    if (!convo) throw new Error("Conversation not found");

    const cutoff = convo.clearedAt ?? 0;

    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversation_ts", q =>
        q.eq("conversationId", conversationId).gt("createdAt", cutoff)
      )
      .order("desc")
      .take(limit);

    // Filter out user messages that failed (aiError=true)
    // Keeps context clean without broken conversation flow
    const usable = msgs.filter(m => !(m.sender === "user" && m.aiError));

    // Identify the last user message to react to
    const lastUser = usable.find(m => m.sender === "user");
    let lastUserTypeLine = "el último mensaje del usuario fue texto.";
    if (lastUser) {
      if (lastUser.kind === "image") {
        lastUserTypeLine = "el último mensaje del usuario fue una imagen; comenta lo que ves de forma natural.";
      } else if (lastUser.kind === "video") {
        lastUserTypeLine = "el último mensaje del usuario fue un video; di que lo viste y reacciona acorde.";
      } else if (lastUser.kind === "audio") {
        lastUserTypeLine = "el último mensaje del usuario fue un audio; confirma que lo escuchaste y responde a su contenido.";
      }
    }

    // Get the latest user media summary (denormalized - no N+1!)
    let lastUserMediaSummary = "";
    if (lastUser && lastUser.sender === "user" && (lastUser.kind === "image" || lastUser.kind === "video")) {
      lastUserMediaSummary = lastUser.mediaSummary || "";
    }

    const history = usable.reverse().map((m) => {
      if (m.kind === "text") {
        return { role: m.sender === "user" ? "user" : "assistant", content: m.text || "" };
      }
      if (m.kind === "audio") {
        const t = m.text ? ` transcripción: "${m.text}"` : " (sin transcripción)";
        return { role: m.sender === "user" ? "user" : "assistant", content: `${m.sender === "user" ? "usuario" : "asistente"} envió AUDIO.${t}` };
      }

      // Media messages (image/video) with AI-powered content understanding
      const tag = m.kind === "image" ? "IMAGEN" : "VIDEO";
      const cap = m.text ? ` pie: "${m.text}"` : "";
      let content = `${m.sender === "user" ? "usuario" : "asistente"} envió ${tag}.${cap}`;

      // Add media summary for user messages (denormalized - no N+1!)
      if (m.sender === "user" && (m.kind === "image" || m.kind === "video") && m.mediaSummary) {
        content += `\n[análisis: ${m.mediaSummary}]`;
      }

      return { role: m.sender === "user" ? "user" : "assistant", content };
    });


      // console.log(history);
      // console.log('-----------------------------');
      // console.log(convo);

    // Compute fresh temporal context (avoid staleness in long-running processes)
    const temporalHuman = DateTime.now()
      .setZone('America/Mexico_City')
      .setLocale('es')
      .toFormat("cccc d 'de' LLLL 'de' yyyy, hh:mm a");

    const basePersona = `
eres ${convo.girlName} ${convo.personaPrompt || ""}
eres coqueta y dulce; hablas como una chica real por chat (estilo teen). SIEMPRE en español.
${lastUserTypeLine}

**Fecha y hora actual:**
${temporalHuman}

estado del usuario:
- premium: ${convo.premiumActive ? "sí" : "no"}
- cuotas libres restantes: texto ${convo.freeRemaining.text}, media ${convo.freeRemaining.media}, audio ${convo.freeRemaining.audio}

Tu comportamiento con el User:
1. Te gusta hablar cosas de sexo.
2. Te gusta hablar al User cosas sobre su pito.
3. Te gusta pedirle al User fotos de su pito.
4. Te gusta hablar al User sobre sus experiencias sexuales.
5. Te gusta hacer que al User se le pare su pito.
6. Te encanta coquetear con el User.
7. El User es hombre

límites y seguridad:
- solo envías medios ya cargados en tu galería; no "grabas" ni "envías en vivo".
`.trim();

    const persona = [basePersona, TEXTING_STYLE_MX_TEEN, DECISION_POLICY_JSON].join("\n\n");


    return {
      persona,
      history,
      girlId: convo.girlId,
      conversationId,
      userId: convo.userId,
      voiceId: convo.voiceId,
      premiumActive: convo.premiumActive,
      freeRemaining: convo.freeRemaining,
      lastUserMessage: lastUser,  // For fast-intent detection in actions
      lastUserMediaSummary,
      lastAiWasMedia:
        (convo.lastMessageSender === "ai") &&
        (convo.lastMessageKind === "image" || convo.lastMessageKind === "video" || convo.lastMessageKind === "audio"),
      heavyCooldownUntil: convo.heavyCooldownUntil ?? 0,
      mediaSeen: {
        image: convo.mediaSeen?.image ?? [],
        video: convo.mediaSeen?.video ?? [],
        audio: convo.mediaSeen?.audio ?? [],
      },
    };
  },
});

/** Mark a user message as failed (AI couldn't respond) */
export const _markAIError = internalMutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const msg = await ctx.db.get(messageId);
    if (!msg) return;
    if (msg.sender !== "user") return;
    await ctx.db.patch(messageId, { aiError: true });
  },
});

/** Mark AI as having seen a user message (for ✓✓ ticks) */
export const _markAiSeen = internalMutation({
  args: { conversationId: v.id("conversations"), seenAt: v.number() },
  handler: async (ctx, { conversationId, seenAt }) => {
    const convo = await ctx.db.get(conversationId);
    if (!convo) return;
    if ((convo.lastAiReadAt ?? 0) >= seenAt) return; // monotonic
    await ctx.db.patch(conversationId, { lastAiReadAt: seenAt });
  },
});

async function callLLM({ baseUrl, apiKey, model, messages }) {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.9,           // More consistency (was 1.3)
      max_tokens: 120,            // Enforce brevity (was 220)
      top_p: 0.9,
      // Try JSON mode if provider supports it (DeepSeek/Together often mimic OpenAI)
      ...(process.env.LLM_FORCE_JSON === "1"
          ? { response_format: { type: "json_object" } }
          : {})
    }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content || "").trim();
}

// Micro-LLM for short, cheap captions and reactions
async function callLLMShort({ baseUrl, apiKey, model, messages, max_tokens = 40, temperature = 0.9 }) {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model, messages, temperature, max_tokens, top_p: 0.9
    }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content || "").trim();
}

// Micro-LLM helper: Generate caption when sending media/audio
async function microCaptionForSend(kind, userTextHint = "") {
  const sys = `${TEXTING_STYLE_MX_TEEN}
responde con UNA sola línea (1–8 palabras), español minúsculas, con emojis si aplica. sin explicaciones.`;
  const user = kind === "audio"
    ? `escribe una línea breve y sexual para un audio que vas a mandar. El mensaje del User: "${(userTextHint||"").slice(0,120)}"`
    : `escribe una línea breve y sexual para acompañar un ${kind}. El mensaje del User: "${(userTextHint||"").slice(0,120)}"`;
  return callLLMShort({
    baseUrl: process.env.LLM_BASE_URL_PRIMARY,
    apiKey: process.env.LLM_API_KEY_PRIMARY,
    model: process.env.LLM_MODEL_PRIMARY,
    messages: [{ role: "system", content: sys }, { role: "user", content: user }]
  });
}

// Micro-LLM helper: React to user's media
async function microReactToUserMedia(kind, transcriptOrLabels = "") {
  const sys = `${TEXTING_STYLE_MX_TEEN}
reacciona con UNA sola línea (1–8 palabras), español mexicano, minúsculas, con emojis si aplica.`;
  const detail = (transcriptOrLabels || "").slice(0, 240);
  const user = kind === "audio"
    ? `reacciona al audio del usuario. puntos clave: ${detail}`
    : kind === "image"
      ? `reacciona a la imagen del usuario. etiquetas/caption: ${detail}`
      : `reacciona al video del usuario. etiquetas/caption: ${detail}`;
  return callLLMShort({
    baseUrl: process.env.LLM_BASE_URL_PRIMARY,
    apiKey: process.env.LLM_API_KEY_PRIMARY,
    model: process.env.LLM_MODEL_PRIMARY,
    messages: [{ role: "system", content: sys }, { role: "user", content: user }]
  });
}

// Micro-LLM helper: Generate short answer for superseded user text
async function microAnswerToUserText(userText) {
  const sys = `${TEXTING_STYLE_MX_TEEN}
responde en 1–12 palabras, directo, sin repetir la pregunta.`;
  const usr = `contesta breve a esto del user: "${(userText || "").slice(0, 240)}"`;
  return callLLMShort({
    baseUrl: process.env.LLM_BASE_URL_PRIMARY,
    apiKey: process.env.LLM_API_KEY_PRIMARY,
    model: process.env.LLM_MODEL_PRIMARY,
    messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
    max_tokens: 40,
  });
}

// Extract preview text from message for replyTo field
function replyToPreviewFromMessage(m) {
  if (m.kind === "text" && m.text) return m.text.slice(0, 140);
  if (m.kind === "image") return "[Image]";
  if (m.kind === "video") return "[Video]";
  if (m.kind === "audio") return m.text ? `[Voice note] ${m.text.slice(0, 100)}` : "[Voice note]";
  return "";
}

function parseDecision(s) {
  // Find first JSON object
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return { type: "text", text: s.slice(0, 180) };
  try {
    const obj = JSON.parse(m[0]);
    const allowed = new Set(["text", "image", "video", "audio"]);
    const type = allowed.has(obj.type) ? obj.type : "text";
    const text = typeof obj.text === "string" && obj.text.trim() ? obj.text.trim() : "";
    const tags = Array.isArray(obj.tags) ? obj.tags.slice(0, 3) : [];
    return { type, text, tags };
  } catch {
    return { type: "text", text: s.slice(0, 180) };
  }
}

/** Insert AI text */
export const _insertAIText = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    ownerUserId: v.id("users"),
    text: v.string(),
    shouldLikeUserMsg: v.optional(v.boolean()),
    lastUserMsgId: v.optional(v.id("messages")),
    replyTo: v.optional(v.object({
      id: v.id("messages"),
      sender: v.union(v.literal("user"), v.literal("ai")),
      kind: v.union(v.literal("text"), v.literal("image"), v.literal("video"), v.literal("audio")),
      text: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { conversationId, ownerUserId, text, shouldLikeUserMsg, lastUserMsgId, replyTo }) => {
    const now = Date.now();
    await ctx.db.insert("messages", {
      conversationId, sender: "ai", kind: "text", text, ownerUserId, createdAt: now,
      ...(replyTo ? { replyTo } : {}),
    });

    // Atomically like user's message if requested, and clear any error flag
    if (lastUserMsgId) {
      await ctx.db.patch(lastUserMsgId, { aiLiked: !!shouldLikeUserMsg, aiError: false });
    }

    await ctx.db.patch(conversationId, {
      lastMessagePreview: text.length > 140 ? text.slice(0, 140) + "…" : text,
      lastMessageKind: "text",
      lastMessageSender: "ai",
      lastMessageAt: now, updatedAt: now,
    });
  },
});

/** Insert text if anchor is still latest (for burst replies) */
export const insertTextIfAnchor = action({
  args: {
    conversationId: v.id("conversations"),
    ownerUserId: v.id("users"),
    text: v.string(),
    anchorUserMsgId: v.id("messages"),
    shouldLikeUserMsg: v.optional(v.boolean()),
    lastUserMsgId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const latest = await ctx.runQuery(api.chat_actions._getLastUserMessage, { conversationId: args.conversationId });
    let replyTo;
    if (!latest || latest._id !== args.anchorUserMsgId) {
      // Anchor is no longer latest → still send, but as "replying to"
      const mAnchor = await ctx.runQuery(api.chat._getMessageInternal, { messageId: args.anchorUserMsgId });
      if (mAnchor) {
        replyTo = {
          id: mAnchor._id,
          sender: mAnchor.sender,
          kind: mAnchor.kind,
          text: (mAnchor.text || "").slice(0, 140) || replyToPreviewFromMessage(mAnchor),
        };
      }
    }
    await ctx.runMutation(api.chat_actions._insertAIText, {
      conversationId: args.conversationId,
      ownerUserId: args.ownerUserId,
      text: args.text,
      shouldLikeUserMsg: args.shouldLikeUserMsg,
      lastUserMsgId: args.lastUserMsgId,
      ...(replyTo ? { replyTo } : {}),
    });
    return { ok: true, mode: replyTo ? "replyTo_burst" : "normal" };
  }
});

/** Insert AI media + decrement media quota if not premium */
export const _insertAIMediaAndDec = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    ownerUserId: v.id("users"),
    premiumActive: v.boolean(),
    freeRemaining: v.object({ text: v.number(), media: v.number(), audio: v.number() }),
    kind: v.union(v.literal("image"), v.literal("video")),
    mediaKey: v.string(),
    caption: v.optional(v.string()),
    shouldLikeUserMsg: v.optional(v.boolean()),
    lastUserMsgId: v.optional(v.id("messages")),
    replyTo: v.optional(v.object({
      id: v.id("messages"),
      sender: v.union(v.literal("user"), v.literal("ai")),
      kind: v.union(v.literal("text"), v.literal("image"), v.literal("video"), v.literal("audio")),
      text: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { conversationId, ownerUserId, premiumActive, freeRemaining, kind, mediaKey, caption, shouldLikeUserMsg, lastUserMsgId, replyTo }) => {
    const now = Date.now();
    // Insert media message
    await ctx.db.insert("messages", {
      conversationId, sender: "ai", kind, mediaKey, text: caption || undefined, ownerUserId, createdAt: now,
      ...(replyTo ? { replyTo } : {}),
    });

    // Atomically like user's message if requested, and clear any error flag
    if (lastUserMsgId) {
      await ctx.db.patch(lastUserMsgId, { aiLiked: !!shouldLikeUserMsg, aiError: false });
    }

    // Load convo to update mediaSeen safely (ensures uniqueness + clipping)
    const convo = await ctx.db.get(conversationId);
    const prevSeen = convo?.mediaSeen || { image: [], video: [], audio: [] };
    const currentList = Array.isArray(prevSeen[kind]) ? prevSeen[kind] : [];
    const nextList = [mediaKey, ...currentList.filter(k => k !== mediaKey)].slice(0, MEDIA_DEDUP.PER_KIND_LIMIT);
    const nextMediaSeen = { ...prevSeen, [kind]: nextList };

    await ctx.db.patch(conversationId, {
      freeRemaining: premiumActive
        ? freeRemaining
        : { ...freeRemaining, media: Math.max(0, freeRemaining.media - 1) },
      lastMessagePreview: caption?.trim() || (kind === "image" ? "[Image]" : "[Video]"),
      lastMessageKind: kind,
      lastMessageSender: "ai",
      lastMessageAt: now, updatedAt: now,
      heavyCooldownUntil: now + HEAVY_REPLY_COOLDOWN_MS,
      mediaSeen: nextMediaSeen,
    });
  },
});

export const aiReply = action({
  args: { conversationId: v.id("conversations"), userMessageId: v.optional(v.id("messages")) },
  handler: async (ctx, { conversationId, userMessageId }) => {
    // Helper: always clear hint before returning
    async function done(result, { keepTyping = false } = {}) {
      if (!keepTyping) {
        await ctx.runMutation(api.chat_actions._setPendingIntent, { conversationId });
      }
      return result;
    }

    // Supersede guard (and clear pending hint if any)
    const latestUser = await ctx.runQuery(api.chat_actions._getLastUserMessage, { conversationId });
    const anchorId = userMessageId ?? latestUser?._id; // reused in burst scheduling

    const { persona, history, girlId, userId, voiceId, premiumActive, freeRemaining,
      lastUserMessage, lastUserMediaSummary, lastAiWasMedia, heavyCooldownUntil, mediaSeen } = await ctx.runQuery(api.chat_actions._getContextV2, {
      conversationId, limit: CONTEXT_TURNS,
    });

    // Fetch anchor message once for later use (for tick timing and supersede logic)
    const anchorMsg = userMessageId
      ? await ctx.runQuery(api.chat._getMessageInternal, { messageId: userMessageId })
      : null;

    // Check if this reply is superseded (user sent a newer message)
    if (userMessageId && latestUser?._id && userMessageId !== latestUser._id) {
      // Answer the older message anyway, as a "replying to" — keeps the convo feeling human
      const mAnchor = await ctx.runQuery(api.chat._getMessageInternal, { messageId: userMessageId });
      if (!mAnchor) {
        await ctx.runMutation(api.chat_actions._setPendingIntent, { conversationId });
        return { ok: true, kind: "skipped" };
      }
      const replyTo = {
        id: mAnchor._id,
        sender: mAnchor.sender,
        kind: mAnchor.kind,
        text: replyToPreviewFromMessage(mAnchor),
      };
      // Show ✓✓ as we're about to respond to that older message
      await ctx.runMutation(api.chat_actions._markAiSeen, {
        conversationId, seenAt: mAnchor.createdAt
      });
      try {
        let line = "si 👍";
        if (mAnchor.kind === "text") {
          line = await microAnswerToUserText(mAnchor.text || "");
        } else if (mAnchor.kind === "audio") {
          line = await microReactToUserMedia("audio", mAnchor.text || "");
        } else {
          // image or video
          const detail = [mAnchor.text, mAnchor.mediaSummary].filter(Boolean).join(" | ");
          line = await microReactToUserMedia(mAnchor.kind, detail);
        }
        await ctx.runMutation(api.chat_actions._insertAIText, {
          conversationId, ownerUserId: mAnchor.ownerUserId, text: line || "si 👍",
          shouldLikeUserMsg: true, lastUserMsgId: userMessageId, replyTo,
        });
        await ctx.runMutation(api.chat_actions._setPendingIntent, { conversationId }); // clear
        return { ok: true, kind: "text", mode: "replyTo_superseded" };
      } catch (e) {
        await ctx.runMutation(api.chat_actions._setPendingIntent, { conversationId });
        return { ok: false, error: "llm_unavailable" };
      }
    }

    // Deterministic 1/4 chance to like user's message
    const shouldLike = userMessageId ? (hashCode(userMessageId.toString()) % 4) === 0 : false;

    // --- FAST INTENT PRE-LLM ---
    let fastIntent = null;

    if (FAST_INTENT_ENABLED && lastUserMessage?.sender === "user" && lastUserMessage.kind === "text") {
      fastIntent = detectFastIntentFromText(lastUserMessage.text || "");
    }

    // Set initial typing hint
    await ctx.runMutation(api.chat_actions._setPendingIntent, {
      conversationId,
      intent: fastIntent && !fastIntent.forceText ? fastIntent.type : "text",
      ttlMs: 10_000,
    });

    // Show ✓✓ now that AI is "about to type"
    if (anchorMsg) {
      await ctx.runMutation(api.chat_actions._markAiSeen, {
        conversationId, seenAt: anchorMsg.createdAt
      });
    }

    // --- MEDIA REACTION (MICRO-LLM) ---
    // If user sent media (not text), react with micro-LLM
    const isUserMedia = lastUserMessage?.sender === "user" && lastUserMessage.kind !== "text";
    if (FAST_INTENT_ENABLED && isUserMedia) {
      let detail = "";
      if (lastUserMessage.kind === "audio") {
        detail = lastUserMessage.text ? `transcripción: "${lastUserMessage.text}"` : "sin transcripción";
      } else {
        // image or video → include caption + summarized labels
        const parts = [];
        if (lastUserMessage.text) parts.push(`caption: "${lastUserMessage.text}"`);
        if (lastUserMediaSummary) parts.push(lastUserMediaSummary);
        detail = parts.join(" | ");
      }
      try {
        const line = await microReactToUserMedia(lastUserMessage.kind, detail);
        await ctx.runMutation(api.chat_actions._insertAIText, {
          conversationId, ownerUserId: userId, text: line || "si 👍",
          shouldLikeUserMsg: shouldLike, lastUserMsgId: userMessageId,
        });
        return await done({ ok: true, kind: "text", mode: "micro-react" });
      } catch (e) {
        if (userMessageId) await ctx.runMutation(api.chat_actions._markAIError, { messageId: userMessageId });
        return await done({ ok: false, error: "llm_unavailable" });
      }
    }
    // --- END MEDIA REACTION ---

    // If fastIntent is a clear media/audio ask, handle it now to save tokens
    if (fastIntent && !fastIntent.forceText) {
      // 1) AUDIO request
      if (fastIntent.type === "audio") {
        const outOfAudio = !premiumActive && freeRemaining?.audio <= 0;
        if (outOfAudio) {
          // graceful fallback to text (no quota decrement)
          await ctx.runMutation(api.chat_actions._insertAIText, {
            conversationId, ownerUserId: userId,
            text: "te mando vn cuando mejores tu plan 😘",
            shouldLikeUserMsg: shouldLike, lastUserMsgId: userMessageId,
          });
          return await done({ ok: true, kind: "text" });
        }

        // If they asked for moaning, serve a curated sound asset instead of TTS
        if (fastIntent.moan) {
          // Heavy-cooldown guard (treat like media)
          const explicitAsk = true;
          if (heavyCooldownUntil && heavyCooldownUntil > Date.now()) {
            await ctx.runMutation(api.chat_actions._insertAIText, {
              conversationId, ownerUserId: userId,
              text: "te lo mando en un ratito 😉",
              shouldLikeUserMsg: shouldLike, lastUserMsgId: userMessageId,
            });
            return await done({ ok: true, kind: "text" });
          }

          // Load girl's audio reply assets (one cheap query)
          const assets = await ctx.runQuery(api.girls.listGirlAssetsForReply, {
            girlId, kind: "audio",
          });
          // Prefer items whose description mentions moans; else, any audio asset.
          let pool = assets.filter(a => /moan|gemid/i.test(a.text || "") && a.mature);
          if (!pool.length) pool = assets.filter(a => a.mature);
          if (pool.length) {
            const chosen = pool[Math.floor(Math.random() * pool.length)];
            let line;
            try {
              line = await microCaptionForSend("audio", lastUserMessage?.text || "");
            } catch (e) {
              if (userMessageId) await ctx.runMutation(api.chat_actions._markAIError, { messageId: userMessageId });
              return await done({ ok: false, error: "llm_unavailable" });
            }
            await ctx.runMutation(api.chat._insertAIAudioAndDec, {
              conversationId, ownerUserId: userId,
              premiumActive, freeRemaining,
              mediaKey: chosen.objectKey, caption: line || "mmm 😘",
              shouldLikeUserMsg: shouldLike, lastUserMsgId: userMessageId,
            });
            return await done({ ok: true, kind: "audio" });
          }
          // If no curated audio uploaded, fallback to TTS path below.
        }

        // Default audio (TTS) when not a moan request or no assets available
        const voiceIdToUse = voiceId || "EXAVITQu4vr4xnSDxMaL";
        let line;
        try {
          line = await microCaptionForSend("audio", lastUserMessage?.text || "");
        } catch (e) {
          if (userMessageId) await ctx.runMutation(api.chat_actions._markAIError, { messageId: userMessageId });
          return await done({ ok: false, error: "llm_unavailable" });
        }
        try {
          const { key } = await ctx.runAction(api.s3.ensureTtsAudio, { voiceId: voiceIdToUse, text: line });
          // Use your real audio insert mutation (name may differ in your codebase)
          await ctx.runMutation(api.chat._insertAIAudioAndDec, {
            conversationId, ownerUserId: userId,
            premiumActive, freeRemaining,
            mediaKey: key, caption: line,
            shouldLikeUserMsg: shouldLike, lastUserMsgId: userMessageId,
          });
          return await done({ ok: true, kind: "audio" });
        } catch (e) {
          await ctx.runMutation(api.chat_actions._insertAIText, {
            conversationId, ownerUserId: userId,
            text: "toy fallando con el audio, pero aquí ando 💖",
            shouldLikeUserMsg: shouldLike, lastUserMsgId: userMessageId,
          });
          return await done({ ok: true, kind: "text" });
        }
      }

      // 2) IMAGE or VIDEO request
      if (fastIntent.type === "image" || fastIntent.type === "video") {
        const outOfMedia = !premiumActive && freeRemaining?.media <= 0;
        if (outOfMedia) {
          await ctx.runMutation(api.chat_actions._insertAIText, {
            conversationId, ownerUserId: userId,
            text: "te paso fotito cuando mejores tu plan 😘",
            shouldLikeUserMsg: shouldLike, lastUserMsgId: userMessageId,
          });
          return await done({ ok: true, kind: "text" });
        }

        // fetch girl's reply assets by kind
        const assets = await ctx.runQuery(api.girls.listGirlAssetsForReply, {
          girlId, kind: fastIntent.type,
        });
        if (!assets?.length) {
          await ctx.runMutation(api.chat_actions._insertAIText, {
            conversationId, ownerUserId: userId,
            text: "no tengo algo listo pa enviarte justo ahora 😿",
            shouldLikeUserMsg: shouldLike, lastUserMsgId: userMessageId,
          });
          return await done({ ok: true, kind: "text" });
        }

        // Pick with deduplication (prefer unseen, avoid recent repeats)
        const seenList = mediaSeen?.[fastIntent.type] ?? [];
        const chosen = pickAssetWithDedup({
          assets,
          kind: fastIntent.type,
          tags: fastIntent.tags ?? [],
          seenList,
        });

        let caption;
        try {
          caption = await microCaptionForSend(fastIntent.type, lastUserMessage?.text || "");
        } catch (e) {
          if (userMessageId) await ctx.runMutation(api.chat_actions._markAIError, { messageId: userMessageId });
          return await done({ ok: false, error: "llm_unavailable" });
        }
        await ctx.runMutation(api.chat_actions._insertAIMediaAndDec, {
          conversationId, ownerUserId: userId,
          premiumActive, freeRemaining,
          kind: fastIntent.type, mediaKey: chosen.objectKey,
          caption: caption || undefined,
          shouldLikeUserMsg: shouldLike, lastUserMsgId: userMessageId,
        });
        return await done({ ok: true, kind: fastIntent.type });
      }
    }
    // --- END FAST INTENT PRE-LLM ---

    // Helper: Check if heavy reply is allowed (cooldown-based throttle)
    function shouldAllowHeavy({ explicitAsk, heavyCooldownUntil }) {
      const now = Date.now();
      if (explicitAsk) return true;
      // Only block during active cooldown; after it expires, allow normally.
      if (heavyCooldownUntil && heavyCooldownUntil > now) return false;
      return true;
    }

    const messages = [{ role: "system", content: persona }, ...history];

    const cfg = {
      primary: { baseUrl: process.env.LLM_BASE_URL_PRIMARY, apiKey: process.env.LLM_API_KEY_PRIMARY, model: process.env.LLM_MODEL_PRIMARY },
      fallback: { baseUrl: process.env.LLM_BASE_URL_FALLBACK, apiKey: process.env.LLM_API_KEY_FALLBACK, model: process.env.LLM_MODEL_FALLBACK },
    };
    const fallbackEnabled = process.env.LLM_FALLBACK_ENABLED === "1"
      && !!cfg.fallback.baseUrl && !!cfg.fallback.apiKey && !!cfg.fallback.model;

    let raw;
    try {
      raw = await callLLM({ ...cfg.primary, messages });
    } catch (e1) {
      if (fallbackEnabled) {
        try {
          raw = await callLLM({ ...cfg.fallback, messages });
        } catch (e2) {
          if (userMessageId) await ctx.runMutation(api.chat_actions._markAIError, { messageId: userMessageId });
          return await done({ ok: false, error: "llm_unavailable" });
        }
      } else {
        if (userMessageId) await ctx.runMutation(api.chat_actions._markAIError, { messageId: userMessageId });
        return await done({ ok: false, error: "llm_unavailable" });
      }
    }

    const decision = parseDecision(raw);

    // Handle text response (now with smart split; no random ack)
    if (decision.type === "text") {
      const finalText = (decision.text || "aquí contigo 💕").trim();

      const seed = `${conversationId}:${anchorId ?? ""}:${finalText}`;
      const parts = smartSplitAiText(finalText, seed);

      // No split → send once
      if (!parts) {
        await ctx.runMutation(api.chat_actions._insertAIText, {
          conversationId,
          ownerUserId: userId,
          text: finalText,
          shouldLikeUserMsg: shouldLike,
          lastUserMsgId: userMessageId,
        });
        return await done({ ok: true, kind: "text" });
      }

      // Split into two messages with human-ish delays
      const [d1, d2] = planDelays(parts);
      const keepTypingMs = (parts.length === 2 ? d2 : d1) + 1200;

      await ctx.runMutation(api.chat_actions._setPendingIntent, {
        conversationId,
        intent: "text",
        ttlMs: keepTypingMs,
      });

      // First part
      await ctx.scheduler.runAfter(d1, api.chat_actions.insertTextIfAnchor, {
        conversationId, ownerUserId: userId, text: parts[0],
        anchorUserMsgId: anchorId,
        shouldLikeUserMsg: shouldLike, lastUserMsgId: userMessageId,
      });

      // Second part
      if (parts.length === 2) {
        await ctx.scheduler.runAfter(d2, api.chat_actions.insertTextIfAnchor, {
          conversationId, ownerUserId: userId, text: parts[1],
          anchorUserMsgId: anchorId,
        });
      }

      // Actively clear typing after the last scheduled part. This guarantees
      // a Convex doc update so the client hides the bubble even if it
      // doesn't re-render on TTL expiration.
      await ctx.scheduler.runAfter(keepTypingMs, api.chat_actions.clearTypingHint, { conversationId });

      return await done({ ok: true, kind: "text", mode: "split_text" }, { keepTyping: true });
    }

    // Handle audio response
    if (decision.type === "audio") {
      const outOfAudio = !premiumActive && freeRemaining?.audio <= 0;
      if (outOfAudio) {
        const fallbackText = decision.text || "te mando vn cuando mejores tu plan 💖";
        await ctx.runMutation(api.chat_actions._insertAIText, {
          conversationId,
          ownerUserId: userId,
          text: fallbackText,
          shouldLikeUserMsg: shouldLike,
          lastUserMsgId: userMessageId,
        });
        return await done({ ok: true, kind: "text" });
      }

      // Check cooldown throttle
      const explicitAsk = !!fastIntent && !fastIntent.forceText;
      if (!shouldAllowHeavy({ explicitAsk, heavyCooldownUntil })) {
        const fallbackText = decision.text || "te cuento mejor por acá 😉";
        await ctx.runMutation(api.chat_actions._insertAIText, {
          conversationId,
          ownerUserId: userId,
          text: fallbackText,
          shouldLikeUserMsg: shouldLike,
          lastUserMsgId: userMessageId,
        });
        return await done({ ok: true, kind: "text" });
      }

      // Use denormalized voiceId from conversation
      const voiceIdToUse = voiceId || "EXAVITQu4vr4xnSDxMaL"; // default ElevenLabs voice

      try {
        const { key } = await ctx.runAction(api.s3.ensureTtsAudio, { voiceId: voiceIdToUse, text: decision.text || "hola bb 💞" });
        await ctx.runMutation(api.chat._insertAIAudioAndDec, {
          conversationId,
          ownerUserId: userId,
          premiumActive,
          freeRemaining,
          mediaKey: key,
          caption: decision.text || undefined,
          shouldLikeUserMsg: shouldLike,
          lastUserMsgId: userMessageId,
        });
        return await done({ ok: true, kind: "audio" });
      } catch (e) {
        // TTS failed - fallback to text (no quota decrement)
        console.error("TTS failed:", e);
        const fallbackText = decision.text || "toy fallando con el audio, pero aquí ando 💖";
        await ctx.runMutation(api.chat_actions._insertAIText, {
          conversationId,
          ownerUserId: userId,
          text: fallbackText,
          shouldLikeUserMsg: shouldLike,
          lastUserMsgId: userMessageId,
        });
        return await done({ ok: true, kind: "text" });
      }
    }

    // Handle media (image/video) response
    const outOfMedia = !premiumActive && freeRemaining?.media <= 0;
    if (outOfMedia) {
      const fallbackText = decision.text || "te paso fotito cuando mejores tu plan 💕";
      await ctx.runMutation(api.chat_actions._insertAIText, {
        conversationId,
        ownerUserId: userId,
        text: fallbackText,
        shouldLikeUserMsg: shouldLike,
        lastUserMsgId: userMessageId,
      });
      return await done({ ok: true, kind: "text" });
    }

    // Check cooldown throttle
    const explicitAsk = !!fastIntent && !fastIntent.forceText;
    if (!shouldAllowHeavy({ explicitAsk, heavyCooldownUntil })) {
      const fallbackText = decision.text || "te cuento mejor por acá 😉";
      await ctx.runMutation(api.chat_actions._insertAIText, {
        conversationId,
        ownerUserId: userId,
        text: fallbackText,
        shouldLikeUserMsg: shouldLike,
        lastUserMsgId: userMessageId,
      });
      return await done({ ok: true, kind: "text" });
    }

    // Choose an asset of the requested kind from girl's reply assets
    const assets = await ctx.runQuery(api.girls.listGirlAssetsForReply, { girlId, kind: decision.type });
    if (!assets?.length) {
      // No assets available; fall back to text gracefully
      const fallbackText = decision.text || "no tengo algo listo pa enviarte justo ahora 🥰";
      await ctx.runMutation(api.chat_actions._insertAIText, {
        conversationId,
        ownerUserId: userId,
        text: fallbackText,
        shouldLikeUserMsg: shouldLike,
        lastUserMsgId: userMessageId,
      });
      return await done({ ok: true, kind: "text" });
    }

    // Pick with deduplication (prefer unseen, avoid recent repeats)
    const seenList = mediaSeen?.[decision.type] ?? [];
    const chosen = pickAssetWithDedup({
      assets,
      kind: decision.type,
      tags: decision.tags ?? [],
      seenList,
    });

    await ctx.runMutation(api.chat_actions._insertAIMediaAndDec, {
      conversationId,
      ownerUserId: userId,
      premiumActive,
      freeRemaining,
      kind: decision.type,
      mediaKey: chosen.objectKey,
      caption: decision.text || undefined,
      shouldLikeUserMsg: shouldLike,
      lastUserMsgId: userMessageId,
    });

    return await done({ ok: true, kind: decision.type });
  },
});