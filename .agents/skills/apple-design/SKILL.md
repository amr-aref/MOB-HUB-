---
name: apple-design
description: Apple's approach to interface design and fluid, physical motion, translated for the web. Use when building or reviewing gesture-driven UI, spring animations, drag/swipe/sheet interactions, momentum and interruptible transitions, translucent materials and depth, typography (optical sizing, tracking, leading), reduced-motion, or the design foundations (feedback, spatial consistency, restraint) behind Apple-style interfaces.
---

# Apple Design

How Apple builds interfaces that stop feeling like a computer and start feeling like an extension of you. This knowledge comes from Apple's WWDC design talks — chiefly *Designing Fluid Interfaces* (WWDC 2018) — distilled and translated into the web platform (CSS, Pointer Events, `requestAnimationFrame`, spring libraries like Motion/Framer Motion).

The through-line: **an interface feels alive when motion starts from the current on-screen value, inherits the user's velocity, projects momentum forward, and can be grabbed and reversed at any instant.** Springs are the tool that makes all of this natural, because they are inherently interruptible and velocity-aware.

## The Core Idea

> "When we align the interface to the way we think and move, something magical happens — it stops feeling like a computer and starts feeling like a seamless extension of us."

An interface is fluid when it behaves like the physical world: things respond instantly, move continuously, carry momentum, resist at boundaries, and can be redirected mid-motion. Everything below is a way to get closer to that.

Apple frames design as serving four human needs: **safety/predictability, understanding, achievement, and joy.** Every rule here serves one of them.

## 1. Response — kill latency

The moment lag appears, the feeling of directness "falls off a cliff." Response is the foundation everything else is built on.

- **Respond on pointer-down, not on release.** Highlight a button the instant it's pressed. Waiting for `click`/touch-up to show feedback feels dead.
- **Be vigilant about every latency.** Audit debounces, artificial timers, transition waits, and the ~300ms tap delay. Anything on the input path that isn't essential is a regression.
- **Feedback must be continuous *during* the interaction, not just at the end.** For a drag, slider, or drawer, update the UI 1:1 with the pointer the whole way through — never animate only when the gesture completes.

```css
/* Feedback lives on the press, and it's instant */
.button:active {
  transform: scale(0.97);
  transition: transform 100ms ease-out;
}
```

## 2. Direct manipulation — 1:1 tracking

> "Touch and content should move together."

When the user drags something, it must stay glued to the finger — and respect the offset from *where they grabbed it*. Snapping to the element's center on grab breaks the illusion immediately.

- Use Pointer Events with `setPointerCapture` so tracking continues even when the pointer leaves the element's bounds.
- Track a short **velocity/position history** (last few `pointermove` events), not just the current point — you'll need velocity at release.

```js
el.addEventListener('pointerdown', (e) => {
  el.setPointerCapture(e.pointerId);
  const grabOffset = e.clientY - el.getBoundingClientRect().top; // respect where they grabbed
  // ...track position + timestamp history for velocity
});
```

## 3. Interruptibility — the single most important principle

> "The thought and the gesture happen in parallel."

Every animation must be interruptible and redirectable at any moment. A user must be able to grab a moving element mid-flight and reverse it without waiting for the animation to finish. A closing modal the user grabs again should follow the finger — not finish closing first, then reopen.

- **Never lock out input during a transition.**
- Read the **live on-screen value** (presentation layer, not model layer) as the starting point for any new animation. A spring interrupted mid-flight should start from its current position and velocity.
- **Springs handle this naturally** — retarget by changing the destination; the spring carries existing velocity forward. Keyframes restart from zero; avoid them for anything interruptible.

```js
// Wrong: starts from the model value (teleports if interrupted mid-animation)
element.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], { duration: 300 });

// Right: read the live position, start from there
const current = getCurrentTranslateY(element); // from getComputedStyle or a running spring
spring.set({ from: current, to: 100, velocity: currentVelocity });
```

## 4. Springs — the motion primitive

Springs are the tool Apple uses for almost all intentional motion. They feel natural because they simulate physics.

**Two config styles:**

```js
// Apple-style (easier to reason about) — recommended
{ type: "spring", duration: 0.5, bounce: 0.2 }

// Traditional physics (more control)
{ type: "spring", mass: 1, stiffness: 100, damping: 10 }
```

**Configuring feel:**

| Want | Adjust |
|---|---|
| Faster/slower | `duration` (Apple) or `stiffness`↑ / `mass`↓ |
| More/less bounce | `bounce`↑ (Apple) or `damping`↓ |
| Critically damped (no overshoot) | `damping = 1.0` (Apple) or `damping = 2√(stiffness × mass)` |
| Under-damped (slight bounce for momentum) | `damping ≈ 0.8` |

Keep bounce subtle (0.1–0.3) in most UI. Reserve visible bounce for drag-to-dismiss and playful moments.

**Handing off velocity:** When a gesture ends, pass the release velocity into the spring so it carries momentum rather than starting from rest.

```js
// gestureVelocity is in px/s from your position history
// normalise if the spring works in 0–1 space
spring.set({ velocity: gestureVelocity / (target - current) });
```

## 5. Momentum and projection

When a flick gesture ends, project where the content *would* land if it kept its momentum and decelerated naturally, then spring to that point.

```
// Approximate landing point
landingPoint = currentPosition + (velocity / 1000) * decayFactor / (1 - decayFactor)
// decay ≈ 0.998 per millisecond (matches iOS feel)
```

Then spring to the nearest valid snap point from there. This is what makes iOS scrolling feel like physics — not just momentum, but projected intent.

## 6. Reversal — the subtle but critical case

When a user reverses direction mid-gesture (starts closing a drawer, then re-opens), the crucial question is: **use velocity sign, not position.** At the moment of release:

- If velocity is toward closed → commit to close (even if position is mostly open)
- If velocity is toward open → commit to open (even if position is mostly closed)

Never use a "50% threshold" for deciding commit/reverse — it ignores the user's intent in the final moment.

## 7. Rubber-banding — boundaries with physics

When dragging past a boundary, don't hard-stop. Apply rising resistance: the further past the boundary, the less the element moves per pixel of pointer movement.

```
// Rubber-band formula: feel free to tune the constant (150 works for most cases)
rubberBandOffset = (1.0 - (1.0 / ((Math.abs(overDrag) * 0.55) / dimension + 1))) * dimension
```

On release, spring back to the boundary.

## 8. Translucent materials and depth

Apple UI uses **translucent chrome** — content scrolls *under* the navigation bar and tab bar, preserving spatial context. The material blurs and tints what's beneath.

```css
.nav-bar {
  backdrop-filter: blur(20px) saturate(1.8);
  background: rgba(255, 255, 255, 0.72); /* light */
  /* or rgba(28, 28, 30, 0.72) for dark */
}
```

- Content bleeds under the chrome — no hard separator line.
- The blur radius (16–24px) should be large enough to obscure text but not so large it loses the sense of depth.
- `saturate()` amplifies the material feel; 1.4–2.0 is the typical range.

## 9. Typography

Apple's type system is optical, not mechanical.

- **Large text gets tighter tracking.** At 34px+: `letter-spacing: -0.02em`. At display sizes (56px+): `-0.03em` or tighter. Body text: near 0 or slightly positive.
- **Leading is tight at large sizes, generous at small.** `line-height: 1.05–1.1` for headlines; `1.4–1.6` for body.
- **Optical sizing**: SF Pro (and variable fonts with `opsz` axis) adjusts letterforms at small sizes for legibility. Respect it.
- **Never fake bold** with `font-weight: 700` on a face not designed for it — use the actual bold variant.
- **Hierarchy through weight and size, not decoration.** Apple uses weight contrast (regular vs. semibold/bold) and size contrast. Color is secondary.

## 10. Reduced motion

`prefers-reduced-motion` means fewer and gentler animations, **not zero**. Keep:
- Opacity transitions (state indication, not movement)
- Color changes
- Crossfades

Remove:
- Slides, scales, translates — any position change
- Spring-based motion

```css
@media (prefers-reduced-motion: reduce) {
  .sheet { animation: fade 0.2s ease; } /* no translateY */
}
```

```js
const reduce = useReducedMotion();
const exitY = reduce ? 0 : '100%';
```

## 11. The eight design foundations (Apple HIG)

1. **Accessibility.** Designed for everyone — not a checklist, a foundation. Color contrast, dynamic type support, VoiceOver, switch control, reduced motion. If it only works for one kind of user, it isn't designed yet.
2. **Feedback.** Every action is acknowledged. Status (progress), completion (checkmark), warning (yellow triangle), error (red). Confirm meaningful actions; validate inline, not on submit. Don't leave users wondering if something worked.
3. **Aesthetics.** Beauty is functional — beautiful software earns trust and invites engagement. Restraint, not decoration. Every visual element earns its place.
4. **Consistency.** Standard controls behave as expected; standard patterns require no learning. Deviate when there's a clear reason; deviate consistently.
5. **Direct manipulation.** Content responds immediately and continuously to input. No modes, no confirm dialogs for reversible actions.
6. **Feedback** (see #2 above).
7. **Metaphors.** Familiar concepts reduce cognitive load — a toggle switches, a slider adjusts a range. But metaphor is a starting point, not a constraint; push past it when the digital medium enables something better.
8. **User control.** Confirm before destructive actions; make operations reversible; give the user a way out. The system supports the user's intent — it doesn't second-guess it.

## 12. Simplicity (not minimalism)

Strip the unnecessary so the core purpose shines. Burying everything in one place looks minimal but isn't simple.

- **Concise**: plain language, no jargon, fewer steps.
- **Clear**: hierarchy — order, spacing, contrast — so the most important thing is the most obvious.
- Every element earns its place. Sometimes *adding* context simplifies (a scrubber that shows time remaining). Show the common path first; advanced options one level deeper.

## Quick Reference

| Need | Technique | Concrete value |
|---|---|---|
| Default UI spring | Critically damped, no overshoot | `damping 1.0`, `response 0.3–0.4` |
| Momentum / flick spring | Under-damped, slight bounce | `damping ~0.8`, `response 0.3–0.4` |
| Gesture → spring velocity | Hand off release velocity | `gestureVelocity / (target − current)` if normalized |
| Flick landing point | Project momentum | `current + (v/1000)·d/(1−d)`, `d ≈ 0.998` |
| Interrupt cleanly | Start from presentation (live) value | read the on-screen transform |
| Avoid reversal "brick wall" | Carry velocity through re-target | spring that blends velocity |
| Reversible transition | Mirror the easing curve | inverse cubic-bézier |
| Decide reverse vs. commit | Use velocity **sign**, not position | at release |
| 1:1 drag | Pointer Events + capture | respect the grab offset |
| Feedback | On pointer-down, continuous | never only at the end |
| Boundary | Rubber-band, don't hard-stop | progressive resistance |
| Translucent chrome | `backdrop-filter` layer | content scrolls under |
| Type tracking | Size-specific, never fixed | tighten large text (`-0.02em`), body near `0` |
| Reduced motion | Cross-fade, not slide/spring | `@media (prefers-reduced-motion)` |
