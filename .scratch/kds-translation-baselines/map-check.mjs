// Verifies that locales/kds.*.json `kds.*` leaves line up 1:1, in order, with
// the registered KDS_COPY keys, so the nested camelCase JSON can be mapped onto
// the kebab-case Ops keys without guessing.
import fs from "node:fs";

export function parseKdsCopy(file = "lib/i18n/kds-copy.ts") {
  const src = fs.readFileSync(file, "utf8");
  const re = /^\s*"((?:[^"\\]|\\.)*)":\s*"((?:[^"\\]|\\.)*)",?\s*$/gm;
  const rows = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    rows.push([JSON.parse(`"${m[1]}"`), JSON.parse(`"${m[2]}"`)]);
  }
  return rows;
}

export function flatten(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]
  );
}

export function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

import { pathToFileURL } from "node:url";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rows = parseKdsCopy();
  const en = readJson("locales/kds.en.json");
  const leaves = flatten({ kds: en.kds });
  console.log("KDS_COPY rows:", rows.length, "| JSON kds.* leaves:", leaves.length);

  const bad = [];
  for (let i = 0; i < Math.max(rows.length, leaves.length); i += 1) {
    const copy = rows[i];
    const leaf = leaves[i];
    if (!copy || !leaf || copy[1] !== leaf[1]) {
      bad.push({ i, copyKey: copy?.[0], jsonKey: leaf?.[0], copyValue: copy?.[1], jsonValue: leaf?.[1] });
    }
  }
  console.log("positional English value mismatches:", bad.length);
  console.log(JSON.stringify(bad.slice(0, 15), null, 1));
}
