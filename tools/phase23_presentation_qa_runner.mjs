import fs from 'node:fs/promises';

const sourcePath = new URL('./phase23_presentation_qa.mjs', import.meta.url);
let source = await fs.readFile(sourcePath, 'utf8');
const broken = "    const plan = scene ? window.__TACTICAL_RIFT_GAME__ && scene.runtime ? scene.runtime.view() : undefined;";
const fixed = "    const plan = scene?.runtime?.view();";
if (!source.includes(broken)) throw new Error('phase23 presentation QA repair target not found');
source = source.replace(broken, fixed);
const encoded = Buffer.from(source, 'utf8').toString('base64');
await import(`data:text/javascript;base64,${encoded}`);
