export interface RoundStatus {
  alive: boolean;
  broken: boolean;
  exposed: boolean;
}

export function clearEndOfRoundStatuses<T extends RoundStatus>(actors: Iterable<T>) {
  for (const actor of actors) {
    actor.exposed = false;
    if (actor.alive) actor.broken = false;
  }
}
