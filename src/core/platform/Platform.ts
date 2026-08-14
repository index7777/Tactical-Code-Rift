export type RuntimePlatform='web'|'mobile'|'desktop';
export function detectRuntimePlatform(userAgent=navigator.userAgent):RuntimePlatform{if('electronAPI' in globalThis)return'desktop';if(/Android|iPhone|iPad|iPod/i.test(userAgent))return'mobile';return'web'}
