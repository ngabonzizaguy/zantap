const THUMB_PALETTE: ReadonlyArray<readonly [string, string]> = [
  ["#ffd2b0", "#f5945f"],
  ["#f7c2cf", "#e87fa3"],
  ["#ffe3a6", "#f0b33c"],
  ["#bfe0f2", "#79b7e0"],
  ["#dcd0f5", "#a78fe0"],
  ["#c9ecd6", "#6dbf8a"],
];

/** Deterministic gradient pair for menu cards without a photo. */
export function thumbGradientForId(id: string): {
  thumbFrom: string;
  thumbTo: string;
} {
  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  const [thumbFrom, thumbTo] =
    THUMB_PALETTE[Math.abs(hash) % THUMB_PALETTE.length];
  return { thumbFrom, thumbTo };
}
