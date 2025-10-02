// convex/chat_actions.js
import { DateTime } from 'luxon';
import { action, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { CONTEXT_TURNS } from "./chat.config.js";


const nowInMexico = DateTime.now()
    .setZone('America/Mexico_City')
    .setLocale('es');

const temporalHuman = nowInMexico.toFormat("cccc d 'de' LLLL 'de' yyyy, hh:mm a");




// --- FAST INTENT TOGGLE ---
// const FAST_INTENT_ENABLED = process.env.FAST_INTENT_ENABLED !== "0"; // default enabled
const FAST_INTENT_ENABLED = 1

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

function cheapAck(seed) {
  const opts = ["si 👍","va","oki","sale 😏","nmms 😂","obvio","tqm","ntp","jajaja","aaay 🙈"];
  return opts[Math.abs(hashCode(String(seed))) % opts.length];
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

function detectFastIntentFromText(text) {
  const t = normalizeMx(text);
  if (!t) return null;

  // Safety: if user claims to be minor, never fast-path to media/audio
  if (/\b(ten[gt]o|tengo)\s*(1[0-7])\b|\bsoy menor\b/.test(t)) return { type: "text", forceText: true };

  if (RE_AUDIO.test(t)) return { type: "audio", tags: [] };
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

    // Fetch media insights using indexed lookups (no table scan)
    const mediaMessageIds = usable
      .filter(m => (m.kind === "image" || m.kind === "video") && m.sender === "user")
      .map(m => m._id);

    const insightsMap = new Map();
    for (const messageId of mediaMessageIds) {
      const insight = await ctx.db
        .query("mediaInsights")
        .withIndex("by_message", q => q.eq("messageId", messageId))
        .first();
      if (insight) {
        insightsMap.set(messageId.toString(), insight);
      }
    }

    // Helper to build a compact label summary
    function summarizeInsights(insights) {
      if (!insights) return "";
      const mods = (insights.moderationLabels || [])
        .filter(l => (l.confidence ?? 0) > 80)
        .slice(0, 3)
        .map(l => String(l.name || "").toLowerCase());
      const scenes = (insights.sceneLabels || [])
        .filter(l => (l.confidence ?? 0) > 80)
        .slice(0, 3)
        .map(l => String(l.name || "").toLowerCase());
      const parts = [];
      if (scenes.length) parts.push(`escena: ${scenes.join(", ")}`);
      if (mods.length) parts.push(`mod: ${mods.join(", ")}`);
      return parts.join(" | ");
    }

    // Build a tiny summary for the *latest* user media (if any)
    let lastUserMediaSummary = "";
    if (lastUser && lastUser.sender === "user" && (lastUser.kind === "image" || lastUser.kind === "video")) {
      const insights = insightsMap.get(lastUser._id.toString());
      lastUserMediaSummary = summarizeInsights(insights);
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

      // Add media insights for user messages (AI content understanding)
      if (m.sender === "user" && (m.kind === "image" || m.kind === "video")) {
        const insights = insightsMap.get(m._id.toString());
        if (insights) {
          const topModLabels = (insights.moderationLabels || [])
            .filter(l => l.confidence > 80)
            .slice(0, 5)
            .map(l => `${l.name} (${l.confidence.toFixed(0)}%)`)
            .join(", ");


          const topSceneLabels = (insights.sceneLabels || [])
            .filter(l => l.confidence > 80)
            .slice(0, 3)
            .map(l => l.name)
            .join(", ");

          if (topModLabels || topSceneLabels) {
            content += `\n[análisis: `;
            if (topModLabels) content += `${topModLabels}`;
            if (topModLabels && topSceneLabels) content += `; `;
            if (topSceneLabels) content += `escena: ${topSceneLabels}`;
            content += `]`;
          }
        }
      }

      return { role: m.sender === "user" ? "user" : "assistant", content };
    });


      // console.log(history);
      // console.log('-----------------------------');
      // console.log(convo);


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
      lastUserMediaSummary
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
  },
  handler: async (ctx, { conversationId, ownerUserId, text, shouldLikeUserMsg, lastUserMsgId }) => {
    const now = Date.now();
    await ctx.db.insert("messages", {
      conversationId, sender: "ai", kind: "text", text, ownerUserId, createdAt: now,
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
  },
  handler: async (ctx, { conversationId, ownerUserId, premiumActive, freeRemaining, kind, mediaKey, caption, shouldLikeUserMsg, lastUserMsgId }) => {
    const now = Date.now();
    // Insert media message
    await ctx.db.insert("messages", {
      conversationId, sender: "ai", kind, mediaKey, text: caption || undefined, ownerUserId, createdAt: now,
    });

    // Atomically like user's message if requested, and clear any error flag
    if (lastUserMsgId) {
      await ctx.db.patch(lastUserMsgId, { aiLiked: !!shouldLikeUserMsg, aiError: false });
    }

    await ctx.db.patch(conversationId, {
      freeRemaining: premiumActive
        ? freeRemaining
        : { ...freeRemaining, media: Math.max(0, freeRemaining.media - 1) },
      lastMessagePreview: caption?.trim() || (kind === "image" ? "[Image]" : "[Video]"),
      lastMessageKind: kind,
      lastMessageSender: "ai",
      lastMessageAt: now, updatedAt: now,
    });
  },
});

export const aiReply = action({
  args: { conversationId: v.id("conversations"), userMessageId: v.optional(v.id("messages")) },
  handler: async (ctx, { conversationId, userMessageId }) => {
    const { persona, history, girlId, userId, voiceId, premiumActive, freeRemaining, lastUserMessage, lastUserMediaSummary } = await ctx.runQuery(api.chat_actions._getContextV2, {
      conversationId, limit: CONTEXT_TURNS,
    });

    // Deterministic 1/4 chance to like user's message
    const shouldLike = userMessageId ? (hashCode(userMessageId.toString()) % 4) === 0 : false;

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
      const line = await microReactToUserMedia(lastUserMessage.kind, detail);
      await ctx.runMutation(api.chat_actions._insertAIText, {
        conversationId, ownerUserId: userId, text: line || "si 👍",
        shouldLikeUserMsg: shouldLike, lastUserMsgId: userMessageId,
      });
      return { ok: true, kind: "text", mode: "micro-react" };
    }
    // --- END MEDIA REACTION ---

    // --- FAST INTENT PRE-LLM ---
    let fastIntent = null;

    if (FAST_INTENT_ENABLED && lastUserMessage?.sender === "user" && lastUserMessage.kind === "text") {
      fastIntent = detectFastIntentFromText(lastUserMessage.text || "");
    }

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
          return { ok: true, kind: "text" };
        }
        const voiceIdToUse = voiceId || "EXAVITQu4vr4xnSDxMaL";
        const line = await microCaptionForSend("audio", lastUserMessage?.text || "");
        try {
          const { key } = await ctx.runAction(api.s3.ensureTtsAudio, { voiceId: voiceIdToUse, text: line });
          // Use your real audio insert mutation (name may differ in your codebase)
          await ctx.runMutation(api.chat._insertAIAudioAndDec, {
            conversationId, ownerUserId: userId,
            premiumActive, freeRemaining,
            mediaKey: key, caption: line,
            shouldLikeUserMsg: shouldLike, lastUserMsgId: userMessageId,
          });
          return { ok: true, kind: "audio" };
        } catch (e) {
          await ctx.runMutation(api.chat_actions._insertAIText, {
            conversationId, ownerUserId: userId,
            text: "toy fallando con el audio, pero aquí ando 💖",
            shouldLikeUserMsg: shouldLike, lastUserMsgId: userMessageId,
          });
          return { ok: true, kind: "text" };
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
          return { ok: true, kind: "text" };
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
          return { ok: true, kind: "text" };
        }

        // tag-based pick, else random
        let chosen = assets[Math.floor(Math.random() * assets.length)];
        if (fastIntent.tags?.length) {
          const tagged = assets.filter(a =>
            fastIntent.tags.some(t => (a.text || "").toLowerCase().includes(t))
          );
          if (tagged.length) chosen = tagged[Math.floor(Math.random() * tagged.length)];
        }

        const caption = await microCaptionForSend(fastIntent.type, lastUserMessage?.text || "");
        await ctx.runMutation(api.chat_actions._insertAIMediaAndDec, {
          conversationId, ownerUserId: userId,
          premiumActive, freeRemaining,
          kind: fastIntent.type, mediaKey: chosen.objectKey,
          caption: caption || undefined,
          shouldLikeUserMsg: shouldLike, lastUserMsgId: userMessageId,
        });
        return { ok: true, kind: fastIntent.type };
      }
    }
    // --- END FAST INTENT PRE-LLM ---

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
          return { ok: false, error: "llm_unavailable" };
        }
      } else {
        if (userMessageId) await ctx.runMutation(api.chat_actions._markAIError, { messageId: userMessageId });
        return { ok: false, error: "llm_unavailable" };
      }
    }

    const decision = parseDecision(raw);

    // Handle text response
    if (decision.type === "text") {
      const fallbackText = decision.text || "aquí contigo 💕";
      await ctx.runMutation(api.chat_actions._insertAIText, {
        conversationId,
        ownerUserId: userId,
        text: fallbackText,
        shouldLikeUserMsg: shouldLike,
        lastUserMsgId: userMessageId,
      });
      return { ok: true, kind: "text" };
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
        return { ok: true, kind: "text" };
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
        return { ok: true, kind: "audio" };
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
        return { ok: true, kind: "text" };
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
      return { ok: true, kind: "text" };
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
      return { ok: true, kind: "text" };
    }

    // Pick by tag if any; else random
    let chosen = assets[Math.floor(Math.random() * assets.length)];
    if (decision.tags && decision.tags.length) {
      const tagged = assets.filter(a =>
        decision.tags.some(t => (a.text || "").toLowerCase().includes(t.toLowerCase()))
      );
      if (tagged.length) chosen = tagged[Math.floor(Math.random() * tagged.length)];
    }

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

    return { ok: true, kind: decision.type };
  },
});