import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const sourcePath = fileURLToPath(new URL('./phase23_presentation_qa.mjs', import.meta.url));
const tempPath = path.join(path.dirname(sourcePath), '.phase23_presentation_qa_patched.mjs');
let source = await fs.readFile(sourcePath, 'utf8');

const replacements = [
  [
    "    const plan = scene ? window.__TACTICAL_RIFT_GAME__ && scene.runtime ? scene.runtime.view() : undefined;",
    "    const plan = scene?.runtime?.view();",
  ],
  [
    "  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });",
    "  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, recordVideo: { dir } });\n  const page = await context.newPage();",
  ],
  [
    "    await page.close();",
    "    await page.close();\n    await context.close();",
  ],
];

for (const [before, after] of replacements) {
  if (!source.includes(before)) throw new Error(`phase23 presentation QA repair target not found: ${before}`);
  source = source.replace(before, after);
}

await fs.writeFile(tempPath, source, 'utf8');
try {
  await import(`${pathToFileURL(tempPath).href}?v=${Date.now()}`);
} finally {
  await fs.rm(tempPath, { force: true });
}
