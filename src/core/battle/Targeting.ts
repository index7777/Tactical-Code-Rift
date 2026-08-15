export interface TargetLifeState{alive:boolean}

export function canTargetActor(target:TargetLifeState,revival=false):boolean{
  return target.alive||revival
}
