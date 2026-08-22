export interface BattleActorPosition {
  actorId: 'rin' | 'chikage' | 'oboro' | 'mo';
  x: number;
  y: number;
}

export interface RefactorBattleLayout {
  width: 1280;
  height: 720;
  timeline: { x: number; y: number; width: number; height: number };
  battlefield: { x: number; y: number; width: number; height: number };
  partyRail: { x: number; y: number; width: number; height: number };
  intentPanel: { x: number; y: number; width: number; height: number };
  hand: { x: number; y: number; width: number; height: number };
  actionPosition: { x: number; y: number };
  reactionPosition: { x: number; y: number };
}

export const REFACTOR_BATTLE_LAYOUT: RefactorBattleLayout = {
  width: 1280,
  height: 720,
  timeline: { x: 0, y: 0, width: 1280, height: 104 },
  battlefield: { x: 0, y: 112, width: 1280, height: 388 },
  partyRail: { x: 20, y: 132, width: 190, height: 348 },
  intentPanel: { x: 1030, y: 132, width: 230, height: 190 },
  hand: { x: 0, y: 508, width: 1280, height: 212 },
  actionPosition: { x: 690, y: 330 },
  reactionPosition: { x: 760, y: 330 },
};

export const PLAYER_HOME_POSITIONS: readonly BattleActorPosition[] = [
  { actorId: 'rin', x: 350, y: 250 },
  { actorId: 'chikage', x: 360, y: 325 },
  { actorId: 'oboro', x: 350, y: 400 },
  { actorId: 'mo', x: 365, y: 465 },
];

export function homePositionFor(actorId: BattleActorPosition['actorId']): BattleActorPosition {
  const position = PLAYER_HOME_POSITIONS.find((entry) => entry.actorId === actorId);
  if (!position) throw new Error(`unknown player actor: ${actorId}`);
  return { ...position };
}
