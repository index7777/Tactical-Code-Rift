export interface EnemyOverheadLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  name: { x: number; y: number };
  intent: { x: number; y: number; width: number; height: number };
  hpBar: { x: number; y: number; width: number; height: number };
  hpValue: { x: number; y: number };
  targetMarker: { x: number; y: number };
}

export function enemyOverheadLayout(actorX: number, actorY: number, perspectiveScale: number): EnemyOverheadLayout {
  const width = 148;
  const height = 48;
  const y = actorY - 96 * perspectiveScale;
  return {
    x: actorX,
    y,
    width,
    height,
    name: { x: actorX - width / 2 + 9, y: y - 14 },
    intent: { x: actorX + width / 2 - 38, y: y - 14, width: 68, height: 16 },
    hpBar: { x: actorX, y: y + 4, width: width - 18, height: 7 },
    hpValue: { x: actorX, y: y + 16 },
    targetMarker: { x: actorX - width / 2 - 9, y },
  };
}
