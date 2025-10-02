Nice start! I dropped an upgraded, Instagram-style viewer in the canvas with:

* top progress segments (with live timing),
* tap-left / tap-right navigation zones,
* press-and-hold to pause,
* swipe-down to close,
* blurred background from the media,
* optional video sound toggle (muted by default),
* image preloading hooks,
* keyboard support (Esc/←/→),
* scroll lock & a11y bits.

### How to use it

* Keep your current props and add (optionally) `currentIndex`, `totalCount`, `nextUrl`, `prevUrl`, `autoAdvance`, and `imageDurationMs`:

```jsx
<StoryViewer
  story={stories[i]}
  signedUrl={stories[i].signedUrl}
  onClose={() => setOpen(false)}
  onNext={() => setI((n) => Math.min(n + 1, stories.length - 1))}
  onPrev={() => setI((n) => Math.max(n - 1, 0))}
  currentIndex={i}
  totalCount={stories.length}
  nextUrl={stories[i + 1]?.signedUrl}
  prevUrl={stories[i - 1]?.signedUrl}
  imageDurationMs={5000}
/>
```

* If you don’t pass `currentIndex/totalCount`, it’ll render a single progress bar and still auto-advance.
* For videos, default is muted; the “Sound On/Off” chip toggles audio (closer to IG behavior than showing native controls).

### Notes & tweaks

* Want edge-to-edge crop like IG? Change `object-contain` to `object-cover` on the `<img>/<video>`.
* If your `story` includes `user: { name, avatarUrl }`, it’ll show the avatar/name next to the time. Otherwise it falls back gracefully.
* Drag distance to close is `>120px`. Adjust that threshold (search for `120`) if you prefer snappier or stricter behavior.

