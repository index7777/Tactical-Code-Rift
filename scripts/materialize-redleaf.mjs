import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root=process.cwd();
const archivePath=path.join(root,'.artifacts','redleaf-runtime-bundle.zip');
if(!fs.existsSync(archivePath))throw new Error(`Missing Redleaf bundle: ${archivePath}`);
const zip=fs.readFileSync(archivePath);
function u16(o){return zip.readUInt16LE(o)}
function u32(o){return zip.readUInt32LE(o)}
function findEocd(){for(let i=zip.length-22;i>=Math.max(0,zip.length-65557);i--)if(u32(i)===0x06054b50)return i;throw new Error('EOCD not found')}
function readEntries(){const eocd=findEocd();const count=u16(eocd+10);let p=u32(eocd+16);const out=new Map();for(let i=0;i<count;i++){if(u32(p)!==0x02014b50)throw new Error(`Bad central directory entry at ${p}`);const method=u16(p+10),compSize=u32(p+20),nameLen=u16(p+28),extraLen=u16(p+30),commentLen=u16(p+32),localOff=u32(p+42);const name=zip.subarray(p+46,p+46+nameLen).toString('utf8');if(u32(localOff)!==0x04034b50)throw new Error(`Bad local entry for ${name}`);const localNameLen=u16(localOff+26),localExtraLen=u16(localOff+28),dataOff=localOff+30+localNameLen+localExtraLen;const compressed=zip.subarray(dataOff,dataOff+compSize);const data=method===0?Buffer.from(compressed):method===8?zlib.inflateRawSync(compressed):(()=>{throw new Error(`Unsupported ZIP method ${method} for ${name}`)})();out.set(name,data);p+=46+nameLen+extraLen+commentLen}return out}
const entries=readEntries();
const get=(name)=>{const v=entries.get(name);if(!v)throw new Error(`Missing Redleaf asset in bundle: ${name}`);return v};
const uri=(name,mime='image/webp')=>`data:${mime};base64,${get(name).toString('base64')}`;
const ensure=(p)=>fs.mkdirSync(path.dirname(p),{recursive:true});
const write=(rel,txt)=>{const p=path.join(root,rel);ensure(p);fs.writeFileSync(p,txt)};
const svgImage=(href,w=360,h=240)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><image width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" href="${href}"/></svg>`;

const poseDir='public/assets/battle/generated/characters/redleaf';
for(const pose of ['idle-a','idle-b','ready','attack-a','hit-a','hit-b','down'])write(`${poseDir}/redleaf-${pose}.svg`,svgImage(uri(`redleaf-${pose}.webp`)));
write(`${poseDir}/redleaf-attack-b.svg`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240"><image width="360" height="240" preserveAspectRatio="xMidYMid meet" href="${uri('redleaf-attack-b.webp')}"/><image x="100" y="18" width="250" height="150" preserveAspectRatio="xMidYMid meet" opacity="0.96" href="${uri('redleaf-slash-arc.webp')}"/></svg>`);
write('public/assets/battle/portraits/redleaf-p11-4-current.svg',svgImage(uri('redleaf-portrait-current.webp'),128,128));
write('public/assets/battle/portraits/redleaf-p11-4-timeline.svg',svgImage(uri('redleaf-portrait-timeline.webp'),128,128));

const prod=`${poseDir}/production`;
const cells=[['idle-a',0,0],['idle-b',360,0],['ready',720,0],['attack-a',1080,0],['attack-b',0,240],['hit-a',360,240],['hit-b',720,240],['down',1080,240]];
const sheetBody=cells.map(([n,x,y])=>`<image x="${x}" y="${y}" width="360" height="240" preserveAspectRatio="xMidYMid meet" href="${uri(`redleaf-${n}.webp`)}"/>`).join('');
write(`${prod}/redleaf-runtime-sprite-sheet.svg`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 480">${sheetBody}</svg>`);
const attackFrames=['attack-a','attack-a','attack-b','attack-b'].map((n,i)=>`<image x="${i*360}" y="0" width="360" height="240" preserveAspectRatio="xMidYMid meet" href="${uri(`redleaf-${n}.webp`)}"/>`).join('');
write(`${prod}/redleaf-attack-sequence.svg`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 240">${attackFrames}</svg>`);
write(`${prod}/redleaf-slash-arc.svg`,svgImage(uri('redleaf-slash-arc.webp'),540,310));
write(`${prod}/redleaf-slash-impact.svg`,svgImage(uri('redleaf-slash-impact.webp'),430,436));
write(`${prod}/redleaf-master-approved-v1.svg`,svgImage(uri('redleaf-master-approved-v1.jpg','image/jpeg'),768,1024));
console.log(`Redleaf PD assets materialized: ${cells.length} pose cells + portraits + attack sequence + FX + approved master.`);
