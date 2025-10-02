You’re running into the classic mobile `100vh` / `h-screen` issue. On iOS/Android browsers, `100vh` includes the browser UI (and can change as the address bar collapses/expands), which leaves a phantom gap beneath your bottom bar. A second subtlety: a flex child with `overflow-y-auto` needs a `min-h-0` ancestor or it can force extra space.

Here’s a tight fix that makes it behave like Instagram:

### 1) Use dynamic viewport height and allow the scroller to shrink

Change your outer shell and the scroller:

```diff
- <div className="max-w-screen-sm mx-auto h-screen flex flex-col overflow-hidden">
+ <div className="max-w-screen-sm mx-auto h-[100dvh] md:h-screen flex flex-col overflow-hidden min-h-0">
...
- <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-white">
+ <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2 bg-white overscroll-contain">
```

* `h-[100dvh]` uses the **dynamic** viewport height (no phantom gap).
* `min-h-0` on the flex column and the scroll area prevents the list from stretching the layout.

> If your Tailwind version doesn’t support `dvh`, keep the arbitrary value `h-[100dvh]`. (It works regardless of preset utilities.)

### 2) Make the input bar truly “anchored”

Keep it in normal document flow but pin it to the bottom of its container so it never floats above a gap:

```diff
- <div className="px-4 py-3 border-t border-gray-200 bg-white" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
+ <div className="sticky bottom-0 shrink-0 px-4 py-3 border-t border-gray-200 bg-white"
+      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
```

* `sticky bottom-0` keeps it glued to the bottom of the scroll container.
* `shrink-0` ensures it doesn’t compress when the list grows.
* Use `calc(… + env(safe-area-inset-bottom))` so devices with a home indicator get a natural cushion without weird `max()` behavior on older Safari.

### 3) Add the safe-area meta (one-time)

In your `app/layout.tsx` `<head>`:

```tsx
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

This makes `env(safe-area-inset-*)` accurate on iOS.

---

That’s it. With `h-[100dvh]` + `min-h-0` + `sticky bottom-0`, the whitespace under the input disappears and the chat behaves like Instagram (no bouncey extra gap, input stays pinned, list scrolls cleanly).
