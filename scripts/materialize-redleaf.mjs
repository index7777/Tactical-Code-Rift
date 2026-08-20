import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const archivePath = path.join(root, '.artifacts', 'redleaf-runtime-bundle.zip');
if (!fs.existsSync(archivePath)) throw new Error(`Missing Redleaf bundle: ${archivePath}`);

const zip = fs.readFileSync(archivePath);
const ZIP_LOCAL = 0x04034b50;
const ZIP_CENTRAL = 0x02014b50;
const ZIP_EOCD = 0x06054b50;

function u16(offset) {
  if (offset < 0 || offset + 2 > zip.length) throw new Error(`ZIP u16 offset out of range: ${offset}/${zip.length}`);
  return zip.readUInt16LE(offset);
}

function u32(offset) {
  if (offset < 0 || offset + 4 > zip.length) throw new Error(`ZIP u32 offset out of range: ${offset}/${zip.length}`);
  return zip.readUInt32LE(offset);
}

function findEocd() {
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65557); i -= 1) {
    if (u32(i) === ZIP_EOCD) return i;
  }
  throw new Error('EOCD not found');
}

function findCentralOffsets(eocd, expectedCount) {
  const offsets = [];
  for (let p = 0; p + 46 <= eocd; p += 1) {
    if (u32(p) === ZIP_CENTRAL) offsets.push(p);
  }
  if (offsets.length < expectedCount) {
    throw new Error(`Expected ${expectedCount} central entries, found ${offsets.length}`);
  }
  return offsets.slice(-expectedCount);
}

function readCentralDirectory() {
  const eocd = findEocd();
  const count = u16(eocd + 10);
  const offsets = findCentralOffsets(eocd, count);
  const entries = offsets.map((p) => {
    const method = u16(p + 10);
    const compSize = u32(p + 20);
    const nameLen = u16(p + 28);
    const name = zip.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    return { name, method, compSize };
  });
  return { entries, centralStart: offsets[0] };
}

function findLocalHeader(name, start, end) {
  for (let p = start; p + 30 <= end; p += 1) {
    if (u32(p) !== ZIP_LOCAL) continue;
    const nameLen = u16(p + 26);
    const extraLen = u16(p + 28);
    const nameStart = p + 30;
    const nameEnd = nameStart + nameLen;
    if (nameEnd > end) continue;
    if (zip.subarray(nameStart, nameEnd).toString('utf8') !== name) continue;
    return { dataOffset: nameEnd + extraLen };
  }
  throw new Error(`Local ZIP entry not found for ${name}`);
}

function readEntries() {
  const { entries: centralEntries, centralStart } = readCentralDirectory();
  const out = new Map();
  let scanFrom = 0;

  for (const entry of centralEntries) {
    const local = findLocalHeader(entry.name, scanFrom, centralStart);
    const dataEnd = local.dataOffset + entry.compSize;
    if (dataEnd > centralStart) {
      throw new Error(`Compressed data out of range for ${entry.name}: ${dataEnd}/${centralStart}`);
    }

    const compressed = zip.subarray(local.dataOffset, dataEnd);
    const data = entry.method === 0
      ? Buffer.from(compressed)
      : entry.method === 8
        ? zlib.inflateRawSync(compressed)
        : (() => { throw new Error(`Unsupported ZIP method ${entry.method} for ${entry.name}`); })();

    out.set(entry.name, data);
    scanFrom = dataEnd;
  }

  return out;
}

const entries = readEntries();
const get = (name) => {
  const value = entries.get(name);
  if (!value) throw new Error(`Missing Redleaf asset in bundle: ${name}`);
  return value;
};
const uri = (name, mime = 'image/webp') => `data:${mime};base64,${get(name).toString('base64')}`;
const ensure = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });
const write = (relativePath, text) => {
  const filePath = path.join(root, relativePath);
  ensure(filePath);
  fs.writeFileSync(filePath, text);
};
const svgImage = (href, width = 360, height = 240) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><image width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" href="${href}"/></svg>`;

const poseDir = 'public/assets/battle/generated/characters/redleaf';
for (const pose of ['idle-a', 'idle-b', 'ready', 'attack-a', 'hit-a', 'hit-b', 'down']) {
  write(`${poseDir}/redleaf-${pose}.svg`, svgImage(uri(`redleaf-${pose}.webp`)));
}
write(`${poseDir}/redleaf-attack-b.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240"><image width="360" height="240" preserveAspectRatio="xMidYMid meet" href="${uri('redleaf-attack-b.webp')}"/><image x="100" y="18" width="250" height="150" preserveAspectRatio="xMidYMid meet" opacity="0.96" href="${uri('redleaf-slash-arc.webp')}"/></svg>`);
write('public/assets/battle/portraits/redleaf-p11-4-current.svg', svgImage(uri('redleaf-portrait-current.webp'), 128, 128));
write('public/assets/battle/portraits/redleaf-p11-4-timeline.svg', svgImage(uri('redleaf-portrait-timeline.webp'), 128, 128));

const prod = `${poseDir}/production`;
const cells = [['idle-a', 0, 0], ['idle-b', 360, 0], ['ready', 720, 0], ['attack-a', 1080, 0], ['attack-b', 0, 240], ['hit-a', 360, 240], ['hit-b', 720, 240], ['down', 1080, 240]];
const sheetBody = cells.map(([name, x, y]) => `<image x="${x}" y="${y}" width="360" height="240" preserveAspectRatio="xMidYMid meet" href="${uri(`redleaf-${name}.webp`)}"/>`).join('');
write(`${prod}/redleaf-runtime-sprite-sheet.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 480">${sheetBody}</svg>`);
const attackFrames = ['attack-a', 'attack-a', 'attack-b', 'attack-b'].map((name, index) => `<image x="${index * 360}" y="0" width="360" height="240" preserveAspectRatio="xMidYMid meet" href="${uri(`redleaf-${name}.webp`)}"/>`).join('');
write(`${prod}/redleaf-attack-sequence.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 240">${attackFrames}</svg>`);
write(`${prod}/redleaf-slash-arc.svg`, svgImage(uri('redleaf-slash-arc.webp'), 540, 310));
write(`${prod}/redleaf-slash-impact.svg`, svgImage(uri('redleaf-slash-impact.webp'), 430, 436));
write(`${prod}/redleaf-master-approved-v1.svg`, svgImage(uri('redleaf-master-approved-v1.jpg', 'image/jpeg'), 768, 1024));
console.log(`Redleaf PD assets materialized: ${cells.length} pose cells + portraits + attack sequence + FX + approved master.`);
