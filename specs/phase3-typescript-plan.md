# Phase 3: TypeScript Migration Plan

## Goal

Add TypeScript incrementally to the extracted platform/core/ modules, starting with leaf modules and working inward. app.html stays as JS glue until module interfaces stabilize under types.

## Step 1: TypeScript Infrastructure (one commit)

### Files to create:

**`tsconfig.json`** (project root):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "outDir": "./dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "./platform/core/*": ["./platform/core/*"]
    }
  },
  "include": [
    "platform/core/**/*.ts",
    "platform/core/**/*.js",
    "shared/**/*.ts",
    "shared/**/*.js"
  ],
  "exclude": ["node_modules", "dist", "cartridges"]
}
```

**Why these settings:**
- `allowJs: true` — lets TS and JS coexist during migration
- `checkJs: false` — don't type-check existing JS files yet (opt-in per file with `// @ts-check`)
- `strict: true` — enforce strictness in new .ts files from day 1
- `noEmit: true` — Vite handles compilation, TS is for checking only
- `module: ES2022` / `moduleResolution: bundler` — matches Vite's native ES module handling
- `isolatedModules: true` — required by Vite's esbuild transform

**Vite config update** — verify `vite.config.js` already handles `.ts` (Vite does natively, no plugin needed).

**package.json scripts** — add:
```json
"typecheck": "tsc --noEmit",
"typecheck:watch": "tsc --noEmit --watch"
```

### Verification:
- `npm run typecheck` passes with 0 errors (all files are still .js, allowJs is true)
- `npm test` still passes
- `npm run build` still passes

---

## Step 2: Shared Domain Types (one commit)

Create `platform/core/types.ts` with interfaces for the shared boundaries:

```typescript
// ==================== Document / DOM Abstractions ====================

/** Minimal document-like interface for testability */
export interface DocumentLike {
  getElementById(id: string): HTMLElement | null;
  createElement?(tagName: string): HTMLElement;
  querySelector?(selector: string): HTMLElement | null;
  querySelectorAll?(selector: string): NodeListOf<HTMLElement>;
  addEventListener?(type: string, listener: EventListener): void;
  body?: HTMLElement;
}

// ==================== User System ====================

export interface UserInfo {
  username: string;
  real_name?: string;
  realName?: string;
}

export interface UserSystemLike {
  currentUser: UserInfo | null;
  getUsers(): Promise<UserInfo[]>;
  verifyUser(username: string, password?: string): Promise<VerifyResult>;
  createUser(username: string, realName: string, password: string): Promise<CreateUserResult>;
  init(): Promise<void>;
  setMeta?(key: string, value: unknown): void;
  getMeta?(key: string): unknown;
}

export interface VerifyResult {
  valid?: boolean;
  error?: string;
  realName?: string;
  isTeacher?: boolean;
}

export interface CreateUserResult {
  success?: boolean;
  error?: string;
}

// ==================== Platform ====================

export interface PlatformLike {
  currentMode: string | null;
  currentCartridge: CartridgeLike | null;
  currentProblem: { context?: ProblemContext } | null;
  gameEngine: GameEngineLike | null;
  inputRenderer: InputRendererLike | null;
  grade(options: { useAI: boolean }): Promise<void>;
  useRetry(): void;
  loadProblem(): Promise<void>;
  getState(): PlatformState;
  submitAppeal(text: string, results: GradingResults | null): Promise<AppealResult>;
  setPreferProvider?(provider: string): void;
  cartridgeLoader?: CartridgeLoaderLike;
}

export interface CartridgeLike {
  manifest: CartridgeManifest;
}

export interface CartridgeManifest {
  meta: { id: string; name?: string };
  modes: CartridgeMode[];
}

export interface CartridgeMode {
  id: string;
  name: string;
  unlockedBy?: string;
  animation?: string;
}

export interface ProblemContext {
  topicId?: string;
  topic?: string;
  [key: string]: unknown;
}

// ==================== Game Engine ====================

export interface GameEngineLike {
  resetProgress(): void;
  getState(): GameState;
  getRequiredGold(modeId: string): number;
  hasOverride(modeId: string): boolean;
  getManifestDefault(modeId: string): number;
  updateOverride(modeId: string, goldRequired: number): void;
  removeOverride(modeId: string): void;
  setOverrides?(overrides: Record<string, number>): void;
}

export interface GameState {
  potentialStar?: StarType;
  starCounts?: StarCounts;
  starsPerMode?: Record<string, StarType>;
  hintsUsed?: number;
  totalPenalties?: number;
  streaks?: Record<string, number>;
}

export type StarType = 'gold' | 'silver' | 'bronze' | 'tin';

export interface StarCounts {
  gold: number;
  silver: number;
  bronze: number;
  tin: number;
}

// ==================== Grading ====================

export type GradingLevel = 'algorithm' | 'ai' | 'teacher';
export type EscalationLevel = 'ai' | 'teacher' | 'ai-appeal';
export type EPI = 'E' | 'P' | 'I';

export interface GradingResults {
  allCorrect?: boolean;
  _aiFailed?: boolean;
  _provider?: string;
  _model?: string;
  fields?: Record<string, FieldResult>;
  [key: string]: unknown;
}

export interface FieldResult {
  score: EPI;
  feedback?: string;
  _provider?: string;
  _model?: string;
}

export interface AppealResult {
  success: boolean;
  allCorrect?: boolean;
  fields?: Record<string, FieldResult>;
}

// ==================== Platform State ====================

export interface PlatformState {
  game: GameState;
  [key: string]: unknown;
}

// ==================== Input Renderer ====================

export interface InputRendererLike {
  clearAllFeedback(): void;
  enable(): void;
  displayAppealResponse?(result: AppealResult): void;
}

// ==================== Cartridge Loader ====================

export interface CartridgeLoaderLike {
  getModes?(): CartridgeMode[];
  getMode?(modeId: string): CartridgeMode | undefined;
}

// ==================== Sound / Celebration ====================

export interface SoundEngineLike {
  init(): void;
  enabled?: boolean;
  setEnabled?(enabled: boolean): void;
  starSound(starType: StarType): void;
  bootChime?(): void;
}

export interface CelebrationLike {
  celebrate(starType: StarType): void;
  showToast(message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number): void;
}

// ==================== Storage / Fetch ====================

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
```

### Why types.ts first:
- Every extracted module uses `config.documentLike`, `config.celebration`, `config.platform`, etc.
- Defining these interfaces once prevents each module from re-inventing its own config shapes
- Tests already mock these interfaces — types formalize what the mocks must satisfy

---

## Step 3: Type Leaf Modules (one commit per batch)

### Batch 3a — zero-coupling leaves (rename .js → .ts, add types):

| Module | Lines | Config props | Reason it's first |
|---|---|---|---|
| `share-modal.js` → `.ts` | 33 | 2 | Simplest module, function-only |
| `animation-controls.js` → `.ts` | 87 | 1 | No external deps beyond DOM |
| `grading-escalation.js` → `.ts` | 55 | 1 | Pure DOM helpers, no callbacks |
| `console-commands.js` → `.ts` | 83 | 6 | No DOM coupling, all injected |

**Process per file:**
1. `git mv platform/core/foo.js platform/core/foo.ts`
2. Import types from `./types.ts`
3. Add type annotations to constructor config, method params, return types
4. Fix any type errors
5. Update import paths in `app.html` (Vite resolves `.ts` imports without extension changes)
6. `npm run typecheck && npm test`

### Batch 3b — medium-coupling modules:

| Module | Lines | Config props |
|---|---|---|
| `username-modal.js` → `.ts` | 225 | 5 |
| `ai-appeal.js` → `.ts` | 125 | 10 |
| `action-buttons.js` → `.ts` | 115 | 11 |
| `teacher-progression.js` → `.ts` | 200 | 11 |
| `time-analytics.js` → `.ts` | 142 | 5 |

### Batch 3c — high-coupling modules:

| Module | Lines | Config props |
|---|---|---|
| `teacher-mode.js` → `.ts` | 182 | 12 |
| `teacher-review.js` → `.ts` | 426 | 10 |
| `settings-media.js` → `.ts` | 388 | 10 |
| `realtime-controller.js` → `.ts` | 321 | 14 |
| `cartridge-loading.js` → `.ts` | 242 | 8 |

---

## Step 4: Type Pre-existing Core Modules (separate commits)

After extracted modules are typed, work through existing `platform/core/` modules that are already clean:

| Priority | Module | Lines | Reason |
|---|---|---|---|
| High | `network-config.js` | ~60 | API payloads, config shapes |
| High | `user-system.js` | 383 | Identity, server verification |
| High | `grading-engine.js` | 338 | Core grading flow types |
| Medium | `websocket-client.js` | 361 | Message protocol types |
| Medium | `cartridge-loader.js` | 307 | Cartridge contract interface |
| Medium | `game-engine.js` | 528 | State machine types |
| Low | `graph-engine.js` | 2348 | Canvas rendering, less type value |
| Low | `input-renderer.js` | 701 | DOM-heavy, less type value |

---

## Step 5: app.html — stays JS, uses types via JSDoc

Add `// @ts-check` to the top of app.html's `<script>` and use JSDoc type annotations for the orchestration callbacks:

```javascript
// @ts-check
/** @type {import('./core/types.js').PlatformLike | null} */
let platform = null;
```

This gets type checking without converting the file to TypeScript, which would be difficult given its HTML wrapper.

---

## Sequencing Rules

1. **Never rename more than 4 files per commit** — keeps diffs reviewable
2. **Run `npm run typecheck && npm test && npm run build` after each batch** — catch regressions immediately
3. **Update test imports** when renaming `.js` → `.ts` (vitest resolves both, but be explicit)
4. **Do not change behavior** — Phase 3 is a typing pass, not a refactor
5. **types.ts is the single source** — modules import from `./types.ts`, not define their own interfaces

## Expected Outcomes

- All 14 extracted modules typed with strict TypeScript
- Shared `types.ts` defines ~25 interfaces covering the entire platform surface
- `npm run typecheck` catches nullability, missing properties, and API shape mismatches
- Zero behavior changes — all 2,167+ tests continue to pass
- app.html gets optional `@ts-check` for orchestration code
