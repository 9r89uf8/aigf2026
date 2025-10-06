// app/robots.js
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/account', '/chat'],
      },
      {
        userAgent: [
          'GPTBot',              // OpenAI ChatGPT
          'ChatGPT-User',        // OpenAI ChatGPT
          'Google-Extended',     // Google Gemini/Bard
          'GoogleOther',         // Google AI products
          'ClaudeBot',           // Anthropic Claude
          'anthropic-ai',        // Anthropic
          'Amazonbot',           // Amazon AI
          'cohere-ai',           // Cohere
          'PerplexityBot',       // Perplexity AI
          'YouBot',              // You.com
        ],
        allow: '/',
        disallow: ['/api/', '/admin/', '/account', '/chat'],
        crawlDelay: 1,
      },
    ],
    sitemap: 'https://noviachat.com/sitemap.xml',
  };
}
