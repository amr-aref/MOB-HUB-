# Animation Standards Reference

The precise values, curves, and rules behind the review. Cite these in findings instead of approximating. Distilled from Emil Kowalski's design engineering philosophy.

## Should it animate? (frequency table)

| Frequency | Decision |
| --- | --- |
| 100+ times/day (keyboard shortcuts, command palette toggle) | No animation. Ever. |
| Tens of times/day (hover effects, list navigation) | Remove or drastically reduce |
| Occasional (modals, drawers, toasts) | Standard animation |
| Rare / first-time (onboarding, feedback, celebrations) | Can add delight |

**Never animate keyboard-initiated actions** — they repeat hundreds of times daily; animation makes them feel slow and disconnected. (Raycast has no open/close animation — correct for something used hundreds of times a day.)

Valid purposes for motion: spatial consistency, state indication, explanation, feedback, preventing jarring change. "It looks cool" on a frequently-seen element is not valid.

## Easing

Decision order:
- Entering or exiting → **`ease-out`** (starts fast, feels responsive)
- Moving / morphing on screen → **`ease-in-out`**
- Hover / color change → **`ease`**
- Constant motion (marquee, progress) → **`linear`**
- Default → **`ease-out`**

**Never `ease-in` on UI.** It starts slow, delaying the exact moment the user is watching. `ease-out` at 200ms *feels* faster than `ease-in` at 200ms.

Built-in CSS easings are too weak. Use strong custom curves:

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);        /* strong ease-out for UI */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);    /* strong ease-in-out for on-screen movement */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);     /* iOS-like drawer curve (Ionic) */
```

Find curves at [easing.dev](https://easing.dev/) or [easings.co](https://easings.co/) — don't hand-roll from scratch.

## Duration

| Element | Duration |
| --- | --- |
| Button press feedback | 100–160ms |
| Tooltips, small popovers | 125–200ms |
| Dropdowns, selects | 150–250ms |
| Modals, drawers | 200–500ms |
| Marketing / explanatory | Can be longer |

**Rule: UI animations stay under 300ms.** A 180ms dropdown feels more responsive than a 400ms one. Faster spinners make load feel faster (same actual time). Instant tooltips after the first (skip delay + animation) make a toolbar feel faster.

## Physicality

- **Never `scale(0)`.** Start from `scale(0.9–0.97)` + `opacity: 0`. Nothing in the real world appears from nothing.
- **Origin-aware popovers.** Scale from the trigger, not center:
  ```css
  .popover { transform-origin: var(--transform-origin); } /* Base UI */
  ```
  **Modals are exempt** — they appear centered in the viewport, keep `transform-origin: center`.
- **Button press feedback.** `transform: scale(0.97)` on `:active`, `transition: transform 160ms ease-out`. Subtle (0.95–0.98). Applies to any pressable element.

## Springs

Feel natural because they simulate physics; no fixed duration — they settle on parameters. Use for: drag with momentum, "alive" elements (Dynamic Island), interruptible gestures, decorative mouse-tracking.

```js
// Apple-style (easier to reason about) — recommended
{ type: "spring", duration: 0.5, bounce: 0.2 }

// Traditional physics (more control)
{ type: "spring", mass: 1, stiffness: 100, damping: 10 }
```

Keep bounce subtle (0.1–0.3); avoid bounce in most UI — reserve for drag-to-dismiss and playful interactions. Springs maintain velocity when interrupted (keyframes restart from zero), so they're ideal for gestures users may reverse mid-motion.

Mouse interactions: interpolate with `useSpring` rather than tying value directly to mouse position (direct = artificial, no momentum). Only do this when the motion is decorative.

## Interruptibility

CSS **transitions** retarget from current state when re-triggered mid-animation. CSS **keyframes** restart from zero — never use them for anything the user can trigger rapidly or reverse.

For gestures and drags:
- Track velocity (last few `pointermove` events: `Math.abs(distance) / elapsedMs`)
- Dismiss on velocity > `~0.11` (a flick should be enough; don't require crossing a distance threshold)
- Hand off release velocity to a spring so momentum carries forward naturally
- Rubber-band at boundaries (rising resistance, not a hard stop)
- Use `setPointerCapture` so tracking continues when the pointer leaves bounds

`@starting-style` for entry without JS (modern browsers):
```css
.popover {
  opacity: 1;
  transform: scale(1);
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}
@starting-style {
  .popover { opacity: 0; transform: scale(0.95); }
}
```

## Asymmetric timing

Deliberate actions (press, hold, destructive confirm) animate **slowly** — the user is deciding. System responses snap **fast**.

```css
/* Release: fast — the system is responding */
.overlay { transition: clip-path 200ms ease-out; }

/* Press: slow — the user is deciding */
.button:active .overlay { transition: clip-path 2s linear; }
```

Exit is always faster than entry (e.g. enter 300ms, exit 200ms). The user has already decided to close; don't make them wait.

## Performance

- **Only `transform` and `opacity`.** These are compositor-only properties — no layout, no paint.
- **`transition: all` is always wrong** — animates unintended properties, some of which will trigger layout.
- **Framer Motion shorthand props (`x`, `y`, `scale`) are not hardware-accelerated** — run on the main thread under load. Target: `animate={{ transform: "translateX(100px)" }}`.
- **Don't drive child transforms via CSS variables on the parent** — recalcs all children's styles. Set `transform` directly.
- **CSS > rAF-based JS** for predetermined motion. WAAPI for programmatic CSS that needs JS control.
- **`filter: blur()` during transitions**: keep under 20px — expensive, especially Safari.

## Clip-path

For reveals, dismissals, and before/after sliders. Two shapes:

```css
/* Inset reveal (wipe from edge) */
clip-path: inset(0 100% 0 0); /* fully hidden */
clip-path: inset(0 0% 0 0);   /* fully visible */
transition: clip-path 400ms var(--ease-out);

/* Circle reveal (expand from center) */
clip-path: circle(0% at 50% 50%);
clip-path: circle(150% at 50% 50%);
```

Prefer `inset()` for directional wipes; `circle()` for radial reveals.

## Gesture handling — full pattern

```js
let startY, lastY, lastTime, velocity;

el.addEventListener('pointerdown', (e) => {
  el.setPointerCapture(e.pointerId);
  startY = lastY = e.clientY;
  lastTime = Date.now();
  velocity = 0;
});

el.addEventListener('pointermove', (e) => {
  const now = Date.now();
  velocity = Math.abs(e.clientY - lastY) / (now - lastTime);
  lastY = e.clientY;
  lastTime = now;
  // update position 1:1 with pointer
});

el.addEventListener('pointerup', () => {
  const distance = lastY - startY;
  if (velocity > 0.11 || distance > threshold) dismiss();
  else snapBack();
});
```

Key rules:
- **Momentum dismissal**: don't require crossing a distance threshold — compute velocity (`Math.abs(distance)/elapsedMs`); dismiss if `> ~0.11`. A flick should be enough.
- **Damping at boundaries**: dragging past a natural edge moves less the further you go (real things slow before stopping).
- **Pointer capture** once dragging starts, so it continues when the pointer leaves bounds.
- **Multi-touch protection**: ignore extra touch points after the drag begins (`if (isDragging) return`) — prevents jumps.
- **Friction over hard stops** — allow over-drag with rising resistance rather than an invisible wall.

## Masking imperfect crossfades

When a crossfade shows two overlapping states despite tuning easing/duration, add subtle `filter: blur(2px)` during the transition to blend them into one perceived transformation. Keep blur < 20px (heavy blur is expensive, especially Safari).

## Stagger

Stagger group entrances; 30–80ms between items. Longer delays feel slow. Stagger is decorative — never block interaction while it plays.

```css
.item { opacity: 0; transform: translateY(8px); animation: fadeIn 300ms ease-out forwards; }
.item:nth-child(2) { animation-delay: 50ms; }
.item:nth-child(3) { animation-delay: 100ms; }
@keyframes fadeIn { to { opacity: 1; transform: translateY(0); } }
```

## Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  .element { animation: fade 0.2s ease; } /* keep opacity/color, drop transform-based motion */
}
@media (hover: hover) and (pointer: fine) {
  .element:hover { transform: scale(1.05); } /* gate hover motion — touch fires false hovers on tap */
}
```

```jsx
const reduce = useReducedMotion();
const closedX = reduce ? 0 : '-100%';
```

Reduced motion means fewer and gentler animations, not zero — keep transitions that aid comprehension, remove movement/position changes.

## Debugging (recommend in reviews when feel is uncertain)

- **Slow motion**: bump duration 2–5× or use DevTools animation inspector. Check colors crossfade cleanly, easing doesn't stop abruptly, `transform-origin` is right, coordinated properties stay in sync.
- **Frame-by-frame**: Chrome DevTools Animations panel reveals timing drift between coordinated properties.
- **Real devices** for gestures (drawers, swipe) — connect a phone, hit the dev server by IP, use Safari remote devtools.
- **Fresh eyes next day** — imperfections invisible during development surface later.

## Cohesion

Match motion to the component's personality: playful can be bouncier; a professional dashboard should be crisp and fast. Sonner feels right partly because easing, duration, design, and even the name are in harmony — slightly slower, `ease` rather than `ease-out`, to feel elegant. Opacity + height in entering/exiting lists is trial and error; there's no formula — adjust until it feels right.
