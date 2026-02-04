/**
 * Central export for all stores
 */

export { user, avatar, getAvatarForUsername } from './user';
export type { UserState } from './user';

export { settings } from './settings';
export type { SettingsState } from './settings';

export { game, currentMode, totalStars, goldStars } from './game';
export type { GameState, StarCounts, StarsPerMode } from './game';

export { problem, currentScenario, hasAnswers, isComplete } from './problem';
export type { ProblemState, Problem, InputField } from './problem';

export { grading, gradingInProgress, hasResults, overallScore } from './grading';
export type { GradingState, FieldResult, Score } from './grading';

export { connection, isOnline, onlineCount, connectionIndicator } from './connection';
export type { ConnectionState, ConnectionStatus, OnlineUser, TransportType } from './connection';

export { toasts, toastList } from './toasts';
export type { Toast, ToastType } from './toasts';
