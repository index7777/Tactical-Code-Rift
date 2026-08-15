export const JOURNEY_MUSIC_FADE_IN_MS=1100;
export const JOURNEY_MUSIC_FADE_OUT_MS=1400;

export function journeyLoopFadeDelayMs(durationSeconds:number,seekSeconds:number,fadeOutMs=JOURNEY_MUSIC_FADE_OUT_MS){
  if(!Number.isFinite(durationSeconds)||durationSeconds<=0)return null;
  const remainingMs=Math.max(0,(durationSeconds-Math.max(0,seekSeconds))*1000);
  return Math.max(0,remainingMs-fadeOutMs)
}
