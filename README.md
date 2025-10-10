This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

Priority Order:
1. Safety check (minor protection) - highest priority
2. Moan check (RE_MOAN) - triggers audio with moan: true
3. Generic audio (RE_AUDIO) - triggers audio with moan: false (TTS)
4. Image/Video checks

✅ Examples That Now Work:

| User Input            | Detection  | Result                 |
  |-----------------------|------------|------------------------|
| "puedes gemir"        | RE_MOAN ✓  | Curated moan audio     |
| "gime para mi"        | RE_MOAN ✓  | Curated moan audio     |
| "quiero oírte gemir"  | RE_MOAN ✓  | Curated moan audio     |
| "manda gemidos"       | RE_MOAN ✓  | Curated moan audio     |
| "gemidito pls"        | RE_MOAN ✓  | Curated moan audio     |
| "manda audio gemidos" | RE_MOAN ✓  | Curated moan audio     |
| "manda voz"           | RE_AUDIO ✓ | TTS audio (moan=false) |
| "graba audio"         | RE_AUDIO ✓ | TTS audio (moan=false) |
| "nota de voz"         | RE_AUDIO ✓ | TTS audio (moan=false) |

🔍 Key Improvements:

1. Natural language support: Users don't need to say "audio" explicitly for moaning
2. Better UX: "puedes gemir" is more natural than "manda audio gemidos"
3. Fallback intact: Regular audio requests still work with TTS
4. No conflicts: Moan check happens first, so priority is correct
