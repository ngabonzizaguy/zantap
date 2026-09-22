// Generates lib/i18n/kds-translations/{rw,fr,sw}.ts from locales/kds.{rw,fr,sw}.json.
//
// The reviewed JSON is nested camelCase (kds.menuActions.restore); the registered
// Ops catalog is flat kebab-case (kds.menu-actions.restore) and the two spellings
// are not mechanically reversible ("30–40 min" -> `30-40-min` vs `3040Min`).
// So keys are matched per section by exact English value, in order, which makes
// duplicate values ("Close", "Cancel") resolve deterministically.
import fs from "node:fs";
import path from "node:path";
import { parseKdsCopy, flatten, readJson } from "./map-check.mjs";

const LOCALES = [
  { code: "rw", constName: "KDS_RW_BASELINE", label: "Kinyarwanda" },
  { code: "fr", constName: "KDS_FR_BASELINE", label: "French" },
  { code: "sw", constName: "KDS_SW_BASELINE", label: "Kiswahili" },
];

const kebab = (segment) =>
  segment.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const sectionOfCopyKey = (key) => key.split(".")[1];
const sectionOfJsonKey = (key) => kebab(key.split(".")[1]);

function groupInOrder(entries, sectionOf) {
  const groups = new Map();
  for (const entry of entries) {
    const section = sectionOf(entry[0]);
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section).push(entry);
  }
  return groups;
}

/** JSON leaf key -> registered KDS_COPY key. Throws if anything is ambiguous. */
function buildKeyMap(copyRows, englishLeaves) {
  const copyGroups = groupInOrder(copyRows, sectionOfCopyKey);
  const jsonGroups = groupInOrder(englishLeaves, sectionOfJsonKey);
  const map = new Map();

  for (const [section, jsonEntries] of jsonGroups) {
    const copyEntries = copyGroups.get(section);
    if (!copyEntries) throw new Error(`No KDS_COPY section "${section}"`);
    if (copyEntries.length !== jsonEntries.length) {
      throw new Error(
        `Section "${section}" size mismatch: JSON ${jsonEntries.length} vs KDS_COPY ${copyEntries.length}`
      );
    }
    const taken = new Set();
    for (const [jsonKey, englishValue] of jsonEntries) {
      const hit = copyEntries.find(
        ([copyKey, copyValue]) => copyValue === englishValue && !taken.has(copyKey)
      );
      if (!hit) throw new Error(`No unused KDS_COPY match in "${section}" for ${jsonKey}: ${JSON.stringify(englishValue)}`);
      taken.add(hit[0]);
      map.set(jsonKey, hit[0]);
    }
  }

  if (map.size !== copyRows.length) {
    throw new Error(`Mapped ${map.size} of ${copyRows.length} registered keys`);
  }
  return map;
}

const placeholders = (value) =>
  [...new Set(value.match(/\{[a-zA-Z][a-zA-Z0-9_]*\}/g) ?? [])].sort().join(",");

function emit({ code, constName, label }, copyRows, translated) {
  const copyEnglish = new Map(copyRows);
  const lines = [
    `import type { KdsDictionary } from "@/lib/i18n/kds-localize";`,
    ``,
    `/**`,
    ` * ${label} baseline for the registered KDS interface catalog (translated from`,
    ` * \`locales/kds.en.json\`, reviewed as \`locales/kds.${code}.json\`). These are`,
    ` * STARTING POINTS: the owner edits any line word-for-word in`,
    ` * Ops → Settings → Languages, which saves a DB override on top.`,
    ` *`,
    ` * Generated — do not hand-edit. Source of truth is \`locales/kds.${code}.json\`.`,
    ` * Brand words ("ZanTap", "MoMo", "WhatsApp", "RWF") stay untranslated.`,
    ` */`,
    `export const ${constName} = {`,
  ];

  let section = null;
  for (const [copyKey] of copyRows) {
    const nextSection = sectionOfCopyKey(copyKey);
    if (nextSection !== section) {
      if (section !== null) lines.push("");
      lines.push(`  // ${nextSection}`);
      section = nextSection;
    }
    const value = translated.get(copyKey);
    if (value === undefined) throw new Error(`${code}: missing value for ${copyKey}`);
    if (placeholders(copyEnglish.get(copyKey)) !== placeholders(value)) {
      throw new Error(`${code}: placeholder drift on ${copyKey}`);
    }
    lines.push(`  ${JSON.stringify(copyKey)}: ${JSON.stringify(value)},`);
  }

  lines.push(`} satisfies KdsDictionary;`, ``);
  return lines.join("\n");
}

const copyRows = parseKdsCopy();
const englishLeaves = flatten({ kds: readJson("locales/kds.en.json").kds });
const keyMap = buildKeyMap(copyRows, englishLeaves);

const outDir = path.join("lib", "i18n", "kds-translations");
fs.mkdirSync(outDir, { recursive: true });

for (const locale of LOCALES) {
  const leaves = flatten({ kds: readJson(`locales/kds.${locale.code}.json`).kds });
  const translated = new Map();
  for (const [jsonKey, value] of leaves) {
    const copyKey = keyMap.get(jsonKey);
    if (!copyKey) throw new Error(`${locale.code}: unmapped JSON key ${jsonKey}`);
    translated.set(copyKey, value);
  }
  const file = path.join(outDir, `${locale.code}.ts`);
  fs.writeFileSync(file, emit(locale, copyRows, translated), "utf8");
  console.log(`${file}: ${translated.size} keys`);
}
