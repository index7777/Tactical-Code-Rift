import { describe, expect, it } from 'vitest';
import { actionForGamepad, actionForKey } from './GameAction';
describe('input action map', () => {
  it('maps keyboard without coupling gameplay to keys', () => { expect(actionForKey('Enter')).toBe('confirm'); expect(actionForKey('KeyM')).toBe('toggleMode'); });
  it('maps standard gamepad buttons to the same actions', () => { expect(actionForGamepad(0)).toBe('confirm'); expect(actionForGamepad(1)).toBe('cancel'); });
  it('maps ready-character switching', () => { expect(actionForKey('Tab')).toBe('nextReady'); expect(actionForGamepad(5)).toBe('nextReady'); });
});
