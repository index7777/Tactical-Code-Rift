export type GameAction = 'confirm' | 'cancel' | 'up' | 'down' | 'nextReady' | 'toggleMode' | 'restart';
export const KEY_ACTIONS: Readonly<Record<string, GameAction>> = {
  Enter: 'confirm', Space: 'confirm', Escape: 'cancel', ArrowUp: 'up', ArrowDown: 'down', KeyW: 'up', KeyS: 'down', Tab: 'nextReady', KeyM: 'toggleMode', KeyR: 'restart',
};

export function actionForKey(code: string): GameAction | undefined { return KEY_ACTIONS[code]; }

export function actionForGamepad(button: number): GameAction | undefined {
  if (button === 0) return 'confirm';
  if (button === 1) return 'cancel';
  if (button === 12) return 'up';
  if (button === 13) return 'down';
  if (button === 5) return 'nextReady';
  if (button === 3) return 'toggleMode';
  if (button === 9) return 'restart';
  return undefined;
}
