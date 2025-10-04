You’re seeing that “hazy / dull” look because this overlay is covering the entire gradient:

```jsx
<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
```

`bg-black/30` lays a 30%-opacity black layer on top of your vibrant gradient, which desaturates it and reads like a blur/haze.

### Quick fixes (pick one)

1. **Remove the dark overlay** (most vibrant):

   ```jsx
   <div className="absolute inset-0 flex flex-col items-center justify-center">
   ```
2. **Make it much lighter** (keep a hint of lock-state):

   ```jsx
   <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
   ```
3. **Use a subtle vignette instead of a full wash** (keeps center vibrant, darkens edges):

   ```jsx
   <div className="absolute inset-0 flex flex-col items-center justify-center 
                   bg-gradient-to-t from-black/40 via-transparent to-transparent">
   ```
4. **Target just the UI, not the whole card**
   Remove `bg-black/...` from the overlay and put a small backdrop behind the button/text instead:

   ```jsx
   <div className="absolute inset-0 flex flex-col items-center justify-center">
     <div className="mb-4">{/* lock svg */}</div>

     <Link
       href="/plans"
       className="px-6 py-2.5 bg-white/95 text-indigo-700 font-semibold rounded-full 
                  hover:bg-white transition-all shadow-lg hover:shadow-xl hover:scale-105"
     >
       Check prices
     </Link>

     <p className="mt-3 text-white text-sm font-semibold drop-shadow">
       Unlock exclusive content
     </p>
   </div>
   ```

### Optional polish

* If the white text/icons feel fuzzy, reduce the shadow weight:

    * `drop-shadow` → `drop-shadow-sm` or remove it.
* If clicks ever pass through an overlay you’ve made transparent, keep the overlay normal and add `pointer-events-none` to elements you don’t want to intercept, and `pointer-events-auto` to the CTA.

That’s it—kill or lighten the black overlay and your gradient will pop again.
