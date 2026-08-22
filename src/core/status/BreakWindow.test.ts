import { describe, expect, it } from 'vitest';
import {
  canConsumeBreakWindow,
  consumeBreakWindow,
  createBreakWindow,
  expireWindowsAfterSuccessfulAction,
  removeConsumedBreakWindows,
  removeWindowsForTarget,
} from './BreakWindow';

describe('BreakWindow', () => {
  it('lets armor-break be consumed only by heavy attacks', () => {
    const window = createBreakWindow('w1', 'ghost-fire', 'armor-break');
    expect(canConsumeBreakWindow(window, 'disruption')).toBe(false);
    expect(canConsumeBreakWindow(window, 'heavy')).toBe(true);
    expect(consumeBreakWindow(window, 'heavy').consumed).toBe(true);
  });

  it('lets imbalance be consumed only by disruption', () => {
    const window = createBreakWindow('w2', 'stone-ogre', 'imbalance');
    expect(canConsumeBreakWindow(window, 'heavy')).toBe(false);
    expect(consumeBreakWindow(window, 'disruption')).toMatchObject({ consumed: true });
  });

  it('does not expire merely because the target was delayed', () => {
    const window = createBreakWindow('w1', 'ghost-fire', 'armor-break');
    expect([window]).toHaveLength(1);
    expect(window.consumed).toBe(false);
  });

  it('expires all unconsumed windows when the target successfully acts', () => {
    const windows = [
      createBreakWindow('w1', 'ghost-fire', 'armor-break'),
      createBreakWindow('w2', 'stone-ogre', 'imbalance'),
    ];

    expect(expireWindowsAfterSuccessfulAction(windows, 'ghost-fire')).toEqual([
      windows[1],
    ]);
  });

  it('removes consumed windows during battle-state cleanup', () => {
    const consumed = consumeBreakWindow(
      createBreakWindow('w1', 'ghost-fire', 'armor-break'),
      'heavy',
    );
    const live = createBreakWindow('w2', 'stone-ogre', 'imbalance');

    expect(removeConsumedBreakWindows([consumed, live])).toEqual([live]);
  });

  it('removes all windows for a dead target', () => {
    const windows = [
      createBreakWindow('w1', 'ghost-fire', 'armor-break'),
      createBreakWindow('w2', 'ghost-fire', 'imbalance'),
      createBreakWindow('w3', 'stone-ogre', 'armor-break'),
    ];

    expect(removeWindowsForTarget(windows, 'ghost-fire')).toEqual([windows[2]]);
  });
});
