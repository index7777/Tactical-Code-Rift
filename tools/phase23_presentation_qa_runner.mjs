import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const sourcePath = fileURLToPath(new URL('./phase23_presentation_qa.mjs', import.meta.url));
const tempPath = path.join(path.dirname(sourcePath), '.phase23_presentation_qa_patched.mjs');
let source = await fs.readFile(sourcePath, 'utf8');
const broken = "    const plan = scene ? window.__TACTICAL_RIFT_GAME__ && scene.runtime ? scene.runtime.view() : undefined;";
const fixed = "    const plan = scene?.runtime?.view();";
if (!source.includes(broken)) throw new Error('phase23 presentation QA repair target not found');
source = source.replace(broken, fixed);
await fs.writeFile(tempPath, source, 'utf8');
try {
  await import(`${pathToFileURL(tempPath).href}?v=${Date.now()}`);
} finally {
  await fs.rm(tempPath, { force: true });
}
