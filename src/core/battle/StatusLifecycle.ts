export interface RoundStatus {
  alive: boolean;
  broken: boolean;
  exposed: boolean;
  // 臨時護甲：由護符（guard）在該回合灌入，回合結束時歸零；
  // 舊有的 shield（永久護甲）不動。
  tempShield?: number;
}

export function clearEndOfRoundStatuses<T extends RoundStatus>(actors: Iterable<T>) {
  for (const actor of actors) {
    actor.exposed = false;
    if (actor.alive) actor.broken = false;
    // 臨時護甲只維持一回合，不論存活狀態一律歸零。
    if (typeof actor.tempShield === 'number') actor.tempShield = 0;
  }
}
