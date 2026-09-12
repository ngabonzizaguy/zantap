/** Persisted word-for-word copy override (Ops → Settings → Languages). */
export interface SiteTranslation {
  locale: string;
  /** Registered marketing dot path or namespaced KDS_COPY key. */
  key: string;
  value: string;
  updatedAt: Date;
}
