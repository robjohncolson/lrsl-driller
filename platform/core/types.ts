/**
 * Shared domain types for platform/core/ modules.
 *
 * These interfaces describe the boundaries that extracted modules
 * already use via config injection. Type-only — no runtime behavior.
 */

// ==================== DOM Abstractions ====================

/** Minimal document-like interface used by all extracted modules for testability. */
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

export interface UserSystemLike {
  currentUser: UserInfo | null;
  getUsers(): Promise<UserInfo[]>;
  verifyUser(username: string, password?: string): Promise<VerifyResult>;
  createUser(username: string, realName: string, password: string): Promise<CreateUserResult>;
  init(): Promise<void>;
}

// ==================== Cartridge / Manifest ====================

export interface CartridgeMode {
  id: string;
  name: string;
  unlockedBy?: string;
  animation?: string;
}

export interface CartridgeMeta {
  id: string;
  name?: string;
}

export interface CartridgeManifest {
  meta: CartridgeMeta;
  modes: CartridgeMode[];
}

export interface CartridgeLike {
  manifest: CartridgeManifest;
}

// ==================== Game Engine ====================

export type StarType = 'gold' | 'silver' | 'bronze' | 'tin';

export interface StarCounts {
  gold: number;
  silver: number;
  bronze: number;
  tin: number;
}

export interface GameState {
  potentialStar?: StarType;
  starCounts?: StarCounts;
  starsPerMode?: Record<string, StarType>;
  hintsUsed?: number;
  totalPenalties?: number;
  streaks?: Record<string, number>;
}

export interface GameEngineLike {
  resetProgress(): void;
  getState(): GameState;
  getRequiredGold(modeId: string): number;
  hasOverride(modeId: string): boolean;
  getManifestDefault(modeId: string): number;
  updateOverride(modeId: string, goldRequired: number): void;
  removeOverride(modeId: string): void;
}

// ==================== Grading ====================

export type GradingLevel = 'algorithm' | 'ai' | 'teacher';
export type EscalationLevel = 'ai' | 'teacher' | 'ai-appeal';
export type EPI = 'E' | 'P' | 'I';

export interface FieldResult {
  score: EPI;
  feedback?: string;
  _provider?: string;
  _model?: string;
}

export interface GradingResults {
  allCorrect?: boolean;
  _aiFailed?: boolean;
  _provider?: string;
  _model?: string;
  fields?: Record<string, FieldResult>;
}

export interface AppealResult {
  success: boolean;
  allCorrect?: boolean;
  fields?: Record<string, FieldResult>;
}

// ==================== Input Renderer ====================

export interface InputRendererLike {
  clearAllFeedback(): void;
  enable(): void;
  displayAppealResponse?(result: AppealResult): void;
}

// ==================== Platform ====================

export interface PlatformState {
  game: GameState;
}

export interface PlatformLike {
  currentMode: string | null;
  currentCartridge: CartridgeLike | null;
  currentProblem: { context?: Record<string, unknown> } | null;
  gameEngine: GameEngineLike | null;
  inputRenderer: InputRendererLike | null;
  grade(options: { useAI: boolean }): Promise<void>;
  useRetry(): void;
  loadProblem(): Promise<void>;
  getState(): PlatformState;
  submitAppeal(text: string, results: GradingResults | null): Promise<AppealResult>;
}

// ==================== Sound / Celebration ====================

export interface SoundEngineLike {
  init(): void;
  starSound(starType: StarType): void;
}

export interface CelebrationLike {
  celebrate(starType: StarType): void;
  showToast(message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number): void;
}

// ==================== Storage ====================

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
