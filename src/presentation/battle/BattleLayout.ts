export interface Point { x: number; y: number }

// Uses the full combat band (roughly y=155..485) so 4v4 remains readable at
// 16:9 while leaving a compact command dock below the battlefield.
const formations: Record<number, Point[]> = {
  1: [{ x: 0, y: 0 }],
  2: [{ x: 36, y: -72 }, { x: -36, y: 72 }],
  3: [{ x: 48, y: -104 }, { x: -42, y: 0 }, { x: 48, y: 104 }],
  4: [{ x: 48, y: -138 }, { x: -42, y: -46 }, { x: 48, y: 46 }, { x: -42, y: 138 }],
};

export function standbyPosition(team: 'player' | 'enemy', count: number, index: number): Point {
  const point = formations[count]![index]!;
  return {
    x: (team === 'player' ? 960 : 320) + (team === 'player' ? point.x : -point.x),
    y: 320 + point.y,
  };
}

export const clashPositions = () => ({ enemy: { x: 560, y: 320 }, player: { x: 720, y: 320 } });
