/**
 * Build the dark-surface variant of the approved ZanTap wordmark:
 * near-black "Zan" glyphs -> off-white #f4f4f3, amber "Tap" preserved.
 * Source: public/brand/approved-z/zantap-wordmark-logo2-transparent.png
 * Output: public/brand/approved-z/zantap-wordmark-logo2-darkbg.png
 *
 * Classification per pixel (alpha preserved untouched):
 *   - "amber"  = red channel clearly dominates blue (R - B > 40) -> keep as-is
 *   - otherwise (the near-black glyphs + their antialias fringe) -> recolor to
 *     off-white, keeping the original alpha so edges stay smooth.
 * Run: node .scratch/product-restructure/build-wordmark-dark.mjs
 */
import sharp from "sharp";

const SRC = "public/brand/approved-z/zantap-wordmark-logo2-transparent.png";
const OUT = "public/brand/approved-z/zantap-wordmark-logo2-darkbg.png";

const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

let amber = 0;
let recolored = 0;
for (let i = 0; i < data.length; i += 4) {
  const a = data[i + 3];
  if (a === 0) continue;
  const r = data[i];
  const b = data[i + 2];
  if (r - b > 40) {
    amber++;
    continue; // keep the brand amber untouched
  }
  data[i] = 244;
  data[i + 1] = 244;
  data[i + 2] = 243;
  recolored++;
}

await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(
  `wrote ${OUT} (${info.width}x${info.height}) — amber kept: ${amber}px, recolored: ${recolored}px`,
);
