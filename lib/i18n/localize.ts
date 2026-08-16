/**
 * Pure helpers to localize the marketing copy tree.
 *
 * Every translatable string is addressed by a dot path into the copy tree
 * (arrays by index), e.g. `hero.headline` or `offer.includes.2`. A locale is
 * a flat `Record<dotPath, string>`; anything missing falls back to English.
 * Non-string leaves (numbers, asset paths are still strings — see
 * NON_TRANSLATABLE) pass through untouched.
 */

/** String leaves become plain `string` (baseline copy uses literal types). */
export type Localized<T> = T extends string
  ? string
  : T extends number | boolean | null | undefined
    ? T
    : { -readonly [K in keyof T]: Localized<T[K]> };

export type TranslationDict = Record<string, string>;

/**
 * Keys that are strings but must never be translated or edited in Ops:
 * asset paths and machine identifiers.
 */
const NON_TRANSLATABLE_LEAF = /(^|\.)(src|icon|id)$/;

export function isTranslatableKey(key: string): boolean {
  return !NON_TRANSLATABLE_LEAF.test(key);
}

/** Deep-clones `tree`, replacing translatable string leaves from `dict`. */
export function localizeTree<T>(tree: T, dict: TranslationDict, prefix = ""): Localized<T> {
  if (typeof tree === "string") {
    const override = isTranslatableKey(prefix) ? dict[prefix] : undefined;
    return (override !== undefined && override !== "" ? override : tree) as Localized<T>;
  }
  if (tree === null || typeof tree !== "object") {
    return tree as Localized<T>;
  }
  if (Array.isArray(tree)) {
    return tree.map((item, index) =>
      localizeTree(item, dict, prefix ? `${prefix}.${index}` : String(index))
    ) as Localized<T>;
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(tree as Record<string, unknown>)) {
    out[key] = localizeTree(value, dict, prefix ? `${prefix}.${key}` : key);
  }
  return out as Localized<T>;
}

/**
 * Flattens the copy tree into `{ dotPath: englishText }` for the Ops editor —
 * only translatable string leaves.
 */
export function flattenCopy(tree: unknown, prefix = ""): TranslationDict {
  if (typeof tree === "string") {
    return isTranslatableKey(prefix) ? { [prefix]: tree } : {};
  }
  if (tree === null || typeof tree !== "object") return {};
  const out: TranslationDict = {};
  const entries = Array.isArray(tree)
    ? tree.map((value, index) => [String(index), value] as const)
    : Object.entries(tree as Record<string, unknown>);
  for (const [key, value] of entries) {
    Object.assign(out, flattenCopy(value, prefix ? `${prefix}.${key}` : key));
  }
  return out;
}
