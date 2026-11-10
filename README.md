# 🎨 Meraki Generic Gallery

[![Angular 22 Zoneless](https://img.shields.io/badge/Angular-22.2.5_Zoneless-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](<https://img.shields.io/badge/Vitest-5.1_Unit_Tests_(47_Passed)-6E9F18?logo=vitest&logoColor=white>)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-1.65_Visual_Regression-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Firebase Hosting](https://img.shields.io/badge/Firebase-Hosting_Keyless_WIF-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v26_LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Conventional Commits](https://img.shields.io/badge/Conventional_Commits-1.0.0-FE5196?logo=conventionalcommits&logoColor=white)](https://www.conventionalcommits.org/)

An enterprise-grade, high-performance web application built with **Angular 22 Zoneless**, **Signals**, **Hardware-Accelerated Theming**, **Client-Side Circuit Breaker Network Resilience**, **Zero Pre-Auth Egress Optimization**, and **Two-Tier Testing (Vitest + Playwright)**, deployed to **Firebase Hosting** using **Keyless Workload Identity Federation (WIF)**.

---

## 🌟 Modern Architectural Highlights

### 1. ⚡ 100% Zoneless Change Detection (`provideZonelessChangeDetection`)

- Completely eliminates **Zone.js** runtime monkey-patching, reducing initial bundle weight and eliminating microtask scheduler contention.
- Change detection cycles are triggered purely on-demand via Angular **Signals** and native browser events, ensuring maximum rendering throughput and predictable execution.

### 2. 🛡️ Zero Pre-Auth API Call Architecture (Cold Start & Egress Optimization)

- On the unauthenticated landing and sign-in page, users can freely toggle between **Marvel**, **NFL**, and **Trivia Showcase** tabs.
- **Pure Local State Decoupling**: Tab switching is driven entirely by `ThemeService` signals and static asset caches, **triggering zero HTTP network calls to the backend microservice**.
- Eliminates premature Cloud Run container cold starts, reduces ingress/egress costs, and ensures instant, sub-millisecond tab switching before authentication.

```mermaid
sequenceDiagram
    autonumber
    actor User as Anonymous Visitor
    participant Landing as SignInComponent
    participant Theme as ThemeService (Signals)
    participant DOM as document.body & CSS Tokens
    participant BE as Cloud Run Microservice

    Note over User,BE: 🚀 PRE-AUTH EXPLORATION (Zero Backend Hits)
    User->>Landing: Clicks "NFL Rosters" tab
    Landing->>Theme: setTheme('nfl')
    Theme->>DOM: Updates data-theme="nfl" (CLS=0, 60fps)
    Note over Landing,BE: ⛔ NO HTTP CALL SENT (Backend stays at 0 instances / $0 cost)

    User->>Landing: Clicks "Sign in with Google" / "Guest Mode"
    Landing->>Landing: Authenticates via Firebase Auth
    Note over Landing,BE: 🔓 POST-AUTH: Route transitions to /gallery
    Landing->>BE: GET /api/gallery/marvel?limit=12 (First live fetch)
```

### 3. 📡 Signals-First Reactive State Management

- **State Encapsulation**: Private writable signals exposed as public readonly signals (`selectedCategorySignal`, `imagesSignal`, `searchQuerySignal`, `currentChallengeSignal`).
- **Signal Forms**: Declarative schema validation using `@angular/forms/signals` (`form()`, `required()`) for mystery card trivia guessing.
- **Derived Computations**: `computed()` derivations for reactive UI states (`isOffline`, `isReconnecting`, `currentCard`).
- **DOM & Theme Synchronization**: Root `effect()` listener in `ThemeService` synchronizes active category selections directly into `document.body` and CSS custom properties with zero manual subscriptions.

### 4. 🔄 Self-Healing Circuit Breaker & Exponential Backoff

The communication layer (`ImagesFromServerService`) incorporates a resilient client-side **Circuit Breaker** with **Exponential Backoff**:

- **`CLOSED` State**: Standard operational state. Automatically attempts up to **3 retries** with exponential delay ($1\text{s} \to 2\text{s} \to 4\text{s}$ with random jitter) during transient network failures.
- **`OPEN` State**: Tripped after consecutive retry failures. Prevents network flooding and renders the high-polish, branded **"Gallery Service Connecting"** offline card with **zero internal URLs or hostnames exposed**.
- **`HALF_OPEN` State**: Initiated when the user clicks **"Try Reconnecting"**. Executes a single probe request with live spinner feedback, immediately resuming live gallery rendering once the backend microservice awakens.

```mermaid
stateDiagram-v2
    [*] --> CLOSED: Initial Load
    CLOSED --> OPEN: 3 Consecutive Retries Fail (Exponential Backoff + Jitter)
    OPEN --> HALF_OPEN: User Clicks "Try Reconnecting"
    HALF_OPEN --> CLOSED: Probe Request Succeeds (200 OK)
    HALF_OPEN --> OPEN: Probe Request Fails (Reset Retry Counter)
```

### 5. 🚀 Hardware-Accelerated Dynamic Theme Engine

- Dual-layer preloaded wallpaper architecture (`.bg-marvel` and `.bg-nfl`) composited via GPU-accelerated CSS `opacity` transitions (`will-change: opacity; transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);`).
- Guarantees **60fps, zero flicker, and zero cumulative layout shifts (CLS = 0)** when toggling between themes.
- Cohesive design tokens transition headers, category filter pills, search focus glows, card elevations, and action buttons dynamically.

---

## 📁 Repository Structure & Scaffold

```text
prj-generic-gallery/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── interceptors/       # App Check attestation token injector
│   │   │   ├── services/           # Analytics & telemetry service
│   │   │   ├── auth.service.ts     # Firebase Auth (Google Sign-In & Guest Mode)
│   │   │   ├── images-from-server.service.ts # Circuit breaker, signals & REST client
│   │   │   ├── loader.service.ts   # Global loading state coordinator
│   │   │   └── theme.service.ts    # Dynamic Marvel/NFL theme engine
│   │   ├── gallery/
│   │   │   ├── card-item/          # Decomposed presentational card component
│   │   │   ├── gallery.component.ts# Main gallery collection & infinite scroll
│   │   │   └── gallery.component.html # Search, category pills, & mode toggle
│   │   ├── game-mode/
│   │   │   ├── game-mode.component.ts # Encapsulated Trivia Game (Signal Forms)
│   │   │   └── game-mode.component.html # Mystery card, clues, & confetti cues
│   │   ├── sign-in/                # Landing page & zero pre-auth showcase
│   │   ├── toolbar/user-menu/      # User profile menu & theme switcher
│   │   ├── loader/                 # Animated infinity SVG loader
│   │   ├── app.config.ts           # Zoneless providers & conditional App Check
│   │   └── app.routes.ts           # Authentication route guards
│   ├── environments/
│   │   ├── environment.ts          # Local dev environment (port 3000, dev key)
│   │   └── environment.prod.ts     # Production environment (CI/CD injected secrets)
│   ├── styles.scss                 # Theme design tokens & CSS custom properties
│   └── main.ts                     # Application bootstrap with zoneless detection
├── tests/
│   └── visual/                     # Playwright visual regression snapshots
├── scripts/
│   └── inject-env.mjs              # CI/CD secret injector for production builds
├── angular.json                    # Modern @angular/build Vite/esbuild configuration
└── vitest.config.ts                # Fast zoneless unit test configuration
```

---

## 📸 Interactive Features & Visual UI Showcase

### 🦸 Marvel Heroes Collection Theme

Features the dynamic Marvel Crimson Red (`#E23636`) palette, responsive category pills, character cards, and live search.

![Marvel Header](tests/visual/__snapshots__/gallery-views.spec.ts-snapshots/marvel-header-desktop-chrome.png)

### 🏈 NFL Players Collection Theme

Transitions instantly to the Official NFL Royal Navy (`#013369`) and Stadium Cyan (`#4FA3E3`) branding with NFL Shield iconography.

![NFL Header](tests/visual/__snapshots__/gallery-views.spec.ts-snapshots/nfl-header-desktop-chrome.png)

### 🔍 Ergonomic Live Search

Instant debounced search filtering with clear action and dynamic focus glow matching active theme tokens.

![Search Bar Active State](tests/visual/__snapshots__/gallery-views.spec.ts-snapshots/search-bar-active-query-desktop-chrome.png)

### 🎮 Interactive Trivia Guessing Game Mode (Play Mode)

Mystery card presentation with obscured character identity, clue reveals, signal-driven form validation, confetti particle explosion on correct guesses, and visual shake animations on incorrect guesses.

![Trivia Game Board](tests/visual/__snapshots__/trivia-modal.spec.ts-snapshots/trivia-game-board-desktop-chrome.png)

### 🔐 Authentication & Guest Mode

Secure authentication supporting Google Sign-in and instant Demo Guest Mode.

![Sign-in Landing Page](tests/visual/__snapshots__/gallery-views.spec.ts-snapshots/sign-in-page-desktop-chrome.png)

---

## 🧪 Two-Tier Testing Architecture

```
                                  Testing Strategy
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        ▼                                                                 ▼
Tier 1: Unit & Signals Suite                               Tier 2: Visual Regression Suite
• Vitest 5.1 + JSDOM 31                                    • Playwright 1.65 (Headless Chromium)
• provideZonelessChangeDetection()                         • Desktop Chrome (1280x800)
• 47 tests across 9 suites in <1.1s                        • Mobile Chrome (390x844)
• Tests services, signals, effects & circuit breaker       • 16 platform-independent pixel baselines
```

### Running Tests Locally

```bash
# Tier 1: Fast Zoneless Unit Tests (Vitest - 47 tests in <1.1s)
npm run test:unit

# Tier 1: Watch mode
npm run test:unit:watch

# Tier 2: Visual Regression Tests (Playwright)
npm run test:visual

# Update visual baseline snapshots
npm run test:visual:update

# Interactive Playwright UI Mode
npm run test:visual:ui
```

---

## 🔒 CI/CD Quality Gates & Keyless Deployment

Every pull request and merge to `develop` and `main` is gated by strict automated checks in GitHub Actions:

```mermaid
flowchart LR
    COMMIT["Conventional Commits"] --> LINT["ESLint (0 errors, 0 warnings)"]
    LINT --> FMT["Prettier Check"]
    FMT --> TC["TypeScript Check (tsc --noEmit)"]
    TC --> UNIT["Vitest Unit Suite (47/47 Passed)"]
    UNIT --> BUILD["Production Bundle Build (@angular/build)"]
    BUILD --> VISUAL["Playwright Visual Suite (16/16 Passed)"]
    VISUAL --> DEPLOY["Firebase Hosting (Keyless WIF)"]
```

- **Keyless Google Cloud Authentication**: Deploys via **Workload Identity Federation (WIF)**. No service account keys (`.json`) are stored in GitHub secrets; GitHub Actions exchanges short-lived OIDC tokens directly with Google Cloud IAM.
- **Fail-Fast Hard Gate**: Continuous Deployment **never** triggers if any quality gate fails.

---

## 🛠️ Local Development & Scripts

### Prerequisites

- **Node.js**: `v24.x` or `v26.x LTS`
- **npm**: `v10.x` or higher

```bash
# Clone the repository
git clone https://github.com/himanshusaraswat/prj-generic-gallery.git
cd prj-generic-gallery

# Install dependencies
npm ci

# Start local Angular development server (port 4200)
npm start

# Run full linting, format check & typecheck
npm run lint
npm run format:check
npm run typecheck

# Production build
npm run build-prod
```

---

## 📄 License

MIT © [Himanshu Saraswat](https://github.com/himanshusaraswat)
