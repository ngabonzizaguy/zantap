// Packs the approved-z 32px and 64px favicon PNGs into app/favicon.ico.
// ICO supports PNG-compressed entries (Vista+), so we write raw PNG blobs
// with an ICONDIR header — no image re-encoding needed.
import { readFileSync, writeFileSync } from "node:fs";

const entries = [
  { size: 32, png: readFileSync("public/brand/approved-z/zantap-z-favicon-32.png") },
  { size: 64, png: readFileSync("public/brand/approved-z/zantap-z-favicon-64.png") },
];

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(entries.length, 4);

const dirSize = 16 * entries.length;
let offset = 6 + dirSize;
const dirs = [];
for (const { size, png } of entries) {
  const dir = Buffer.alloc(16);
  dir.writeUInt8(size === 256 ? 0 : size, 0); // width
  dir.writeUInt8(size === 256 ? 0 : size, 1); // height
  dir.writeUInt8(0, 2); // palette
  dir.writeUInt8(0, 3); // reserved
  dir.writeUInt16LE(1, 4); // color planes
  dir.writeUInt16LE(32, 6); // bits per pixel
  dir.writeUInt32LE(png.length, 8);
  dir.writeUInt32LE(offset, 12);
  dirs.push(dir);
  offset += png.length;
}

writeFileSync(
  "app/favicon.ico",
  Buffer.concat([header, ...dirs, ...entries.map((e) => e.png)])
);
console.log("app/favicon.ico written:", offset, "bytes");
