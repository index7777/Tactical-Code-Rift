export interface Point { x: number; y: number }

// Uses the full combat band (roughly y=155..485) so 4v4 remains readable at
// 16:9 while leaving a compact command dock below the battlefield.
const formations: Record<number, Point[]> = {
  1: [{ x: 0, y: 0 }],
  2: [{ x: 42, y: -66 }, { x: -42, y: 66 }],
  3: [{ x: 70, y: -94 }, { x: -55, y: 0 }, { x: 70, y: 94 }],
  4: [{ x: 75, y: -138 }, { x: -55, y: -46 }, { x: 75, y: 46 }, { x: -55, y: 138 }],
};

export function standbyPosition(team: 'player' | 'enemy', count: number, index: number): Point {
  const point = formations[count]![index]!;
  return {
    x: (team === 'player' ? 1010 : 270) + (team === 'player' ? point.x : -point.x),
    y: 320 + point.y,
  };
}

export const clashPositions = () => ({ enemy: { x: 560, y: 320 }, player: { x: 720, y: 320 } });
