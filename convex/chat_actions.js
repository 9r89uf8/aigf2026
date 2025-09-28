// convex/chat_actions.js
import { action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Helper: small context slice (text only)
export const _getContext = internalQuery({
  args: { conversationId: v.id("conversations"), limit: v.number() },
  handler: async (ctx, { conversationId, limit }) => {
    const convo = await ctx.db.get(conversationId);
    const girl = convo ? await ctx.db.get(convo.girlId) : null;

    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversation_ts", q => q.eq("conversationId", conversationId))
      .order("desc")
      .take(limit);

    const history = msgs.reverse().map(m => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
    }));

    return {
      persona: girl?.personaPrompt ?? "Be friendly and concise.",
      history,
    };
  },
});

async function callOpenAICompat({ baseUrl, apiKey, model, messages }) {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 1.3,
      max_tokens: 220,
    }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty LLM reply");
  return text;
}

export const aiReply = action({
  args: {
    conversationId: v.id("conversations"),
    userMessageId: v.id("messages"),
  },
  handler: async (ctx, { conversationId }) => {
    const { persona, history } = await ctx.runQuery(api.chat_actions._getContext, {
      conversationId, limit: 8,
    });

    const messages = [
      { role: "system", content: persona },
      ...history,
      // No tool calls in Section 1; text reply only.
    ];

    // Primary: DeepSeek (OpenAI-compatible). Fallback: Together.ai.
    const cfg = {
      primary: {
        baseUrl: process.env.LLM_BASE_URL_PRIMARY,     // e.g. https://api.deepseek.com
        apiKey: process.env.LLM_API_KEY_PRIMARY,
        model: process.env.LLM_MODEL_PRIMARY,          // e.g. deepseek-chat
      },
      fallback: {
        baseUrl: process.env.LLM_BASE_URL_FALLBACK,    // e.g. https://api.together.xyz
        apiKey: process.env.LLM_API_KEY_FALLBACK,
        model: process.env.LLM_MODEL_FALLBACK,         // e.g. meta-llama/...
      },
    };

    let text;
    try {
      text = await callOpenAICompat({ ...cfg.primary, messages });
    } catch (e) {
      // Fallback on transient failures
      text = await callOpenAICompat({ ...cfg.fallback, messages });
    }

    await ctx.runMutation(api.chat._insertAIMessage, { conversationId, text });
    return { ok: true };
  },
});