export type BreakWindowKind = 'armor-break' | 'imbalance';
export type BreakWindowConsumer = 'heavy' | 'disruption';

export interface BreakWindowState {
  id: string;
  targetId: string;
  kind: BreakWindowKind;
  consumed: boolean;
}

export function createBreakWindow(
  id: string,
  targetId: string,
  kind: BreakWindowKind,
): BreakWindowState {
  if (!id) throw new Error('break window id is required');
  if (!targetId) throw new Error('break window targetId is required');
  return { id, targetId, kind, consumed: false };
}

export function canConsumeBreakWindow(
  window: BreakWindowState,
  consumer: BreakWindowConsumer,
): boolean {
  if (window.consumed) return false;
  return (
    (window.kind === 'armor-break' && consumer === 'heavy')
    || (window.kind === 'imbalance' && consumer === 'disruption')
  );
}

export function consumeBreakWindow(
  window: BreakWindowState,
  consumer: BreakWindowConsumer,
): BreakWindowState {
  if (!canConsumeBreakWindow(window, consumer)) return { ...window };
  return { ...window, consumed: true };
}

export function expireWindowsAfterSuccessfulAction(
  windows: readonly BreakWindowState[],
  actorId: string,
): BreakWindowState[] {
  return windows
    .filter((window) => window.targetId !== actorId)
    .map((window) => ({ ...window }));
}

export function removeConsumedBreakWindows(
  windows: readonly BreakWindowState[],
): BreakWindowState[] {
  return windows.filter((window) => !window.consumed).map((window) => ({ ...window }));
}

export function removeWindowsForTarget(
  windows: readonly BreakWindowState[],
  targetId: string,
): BreakWindowState[] {
  return windows.filter((window) => window.targetId !== targetId).map((window) => ({ ...window }));
}
