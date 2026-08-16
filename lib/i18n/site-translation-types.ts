/** Persisted word-for-word copy override (Ops → Settings → Languages). */
export interface SiteTranslation {
  locale: string;
  /** Dot path into MARKETING_COPY, e.g. `hero.headline`. */
  key: string;
  value: string;
  updatedAt: Date;
}
