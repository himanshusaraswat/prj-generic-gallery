---
entity_id: prj-generic-gallery-agent-guide
name: Angular 22 Zoneless & Google Modern Web Guidance (MWG) Agent Guide
version: 1.0.0
framework: angular-22-zoneless
styling: modern-css-container-queries-tokens
testing: vitest-5.1
hosting: firebase-hosting
compliance:
  - angular-agents-ai-guide
  - google-modern-web-guidance
  - wcag-2.2-aa
---

# 🎨 Frontend Agent Guide: Angular 22 Zoneless & Google MWG

This guide defines the non-negotiable coding, design, and testing standards for [`prj-generic-gallery`](./README.md). All AI agents and developers contributing to this codebase must adhere strictly to these rules.

---

## 🅰️ Part 1: Angular Agents AI Guide Standards

### 1. 100% Zoneless Architecture

- The application runs without Zone.js, configured via `provideZonelessChangeDetection()` in [`app.config.ts`](./src/app/app.config.ts).
- **Rules**:
  - ❌ **NEVER** import `zone.js` or add `zone.js` to polyfills.
  - ❌ **NEVER** inject `ChangeDetectorRef` to call `detectChanges()` or `markForCheck()`.
  - ❌ **NEVER** inject `NgZone` or call `ngZone.run()`.
  - ✅ State changes are automatically tracked and scheduled by Angular's Zoneless scheduler when Signals update.

### 2. Pure Signal Primitives

- Always use modern Angular signal primitives:
  - Local state: `signal<T>(initialValue)`
  - Derived state: `computed(() => ...)`
  - Linked / Dependent state: `linkedSignal(() => ...)`
  - Component Inputs: `input<T>()` or `input.required<T>()`
  - Component Outputs: `output<T>()` (replaces legacy `@Output()` EventEmitter)
  - Two-way binding: `model<T>()`
  - DOM / View Queries: `viewChild<ElementRef>('ref')`, `viewChildren(...)`

### 3. Signal-Based Reactive Forms

- Use `@angular/forms/signals` for all input controls and interactive forms.
- Benefit: Type-safe, reactive, zero `ControlValueAccessor` boilerplate, and seamless integration with the Zoneless change detection cycle.

### 4. Dependency Injection & Component Architecture

- Use `inject()` function for all dependency injection:
  ```typescript
  // Recommended
  private readonly galleryService = inject(ImagesFromServerService);
  private readonly appCheck = inject(AppCheckService);
  ```
- All components must be standalone (`standalone: true` or default in Angular 22).

### 5. App Check Interceptor Security (Strict CDN Isolation)

- `X-Firebase-AppCheck` tokens represent elevated security credentials.
- **Rule**: Tokens must **ONLY** be attached to our first-party Fastify microservice API.
- **Prohibition**: Never attach `X-Firebase-AppCheck` to external CDNs or third-party origins (Unsplash, Picsum, Google Fonts, Firebase Storage CDN).
- Inspect [`appCheckInterceptor`](./src/app/core/interceptors/app-check.interceptor.ts) and verify `isTargetApiUrl(req.url)` safeguards are preserved.

### 6. Vitest Testing & Non-DOM Mocking Standards

- Tests run under Vitest with JSDOM.
- **Rule**: Any third-party library that relies on `<canvas>`, WebGL, or window animation frames (e.g. `canvas-confetti`) **must be mocked at the top of the test file**:
  ```typescript
  vi.mock('canvas-confetti', () => ({
    default: vi.fn()
  }));
  ```
- Ensure all fake timers are cleanly restored (`vi.useRealTimers()`) to prevent uncaught timer exceptions in CI.

---

## 🌐 Part 2: Google Modern Web Guidance (MWG) Standards

All UI components and CSS layouts must conform to **Google Modern Web Guidance (MWG)**. Query the official tool when planning new UI patterns:

```sh
npx -y modern-web-guidance@latest search "<pattern>"
```

### 1. Web Platform Baseline Primitives

- **Modals & Dialogs**:
  - Always use native `<dialog>` with `dialogRef.showModal()`.
  - Use native `::backdrop` styling.
  - Implement Escape key handling and focus trapping natively.
  - Do not introduce bloated 3rd-party modal frameworks.
- **Popovers & Overlays**:
  - Use the native HTML Popover API (`popover="auto"` or `popover="manual"`) and CSS Anchor Positioning where supported.
- **Expandable Content**:
  - Use native `<details>` and `<summary>` elements for accordions and disclosures.

### 2. Modern CSS Layout, Animation & Architecture

- **Container Queries (`@container`)**:
  - Prefer `@container` queries over viewport `@media` queries for reusable cards, gallery items, and sidebar widgets.
- **CSS Subgrid**:
  - Use `grid-template-rows: subgrid` for multi-card layouts so headers, images, and action buttons align horizontally across columns.
- **Native CSS Nesting**:
  - Use standard CSS nesting (`& > ...`, `&.is-active`) directly without requiring preprocessor transforms.
- **View Transitions API**:
  - Wrap page transitions and gallery filter updates in `document.startViewTransition(() => ...)` for smooth hardware-accelerated animations.

### 3. Performance & Asset Optimization

- **Content Visibility**:
  - Apply `content-visibility: auto` and `contain-intrinsic-size` to below-the-fold gallery cards to skip off-screen rendering.
- **Fetch Priority & Image Lazy Loading**:
  - For hero / LCP images: `fetchpriority="high"`, `loading="eager"`.
  - For gallery grid images: `loading="lazy"`, `decoding="async"`.
  - Use responsive `<picture>` tags with modern formats (`image/webp`, `image/avif`) and `srcset`.

### 4. Accessibility (a11y) & WCAG 2.2 AA Compliance

- **Touch Target Sizes**: All interactive elements (buttons, links, chips, toggles) must meet the minimum tap target size of **$\ge 48\times 48\text{px}$** with at least $8\text{px}$ spacing.
- **Color Contrast**: Minimum contrast ratio of **$4.5:1$** for standard text and **$3:1$** for UI boundaries against their backgrounds.
- **Keyboard Navigation**: All interactive elements must be focusable via Tab, exhibit visible `:focus-visible` focus rings, and support Enter/Space activation.
- **Reduced Motion**: Always wrap intense keyframe animations in `@media (prefers-reduced-motion: no-preference)`.

---

## 🚦 Shift-Left Quality Gate

Before pushing any commit, run:

```sh
# 1. Typecheck
npm run typecheck

# 2. Unit Tests (All 47 tests must pass)
npm run test:unit
```

Husky pre-commit hooks (`.husky/pre-commit`) will reject commits if either command fails.
