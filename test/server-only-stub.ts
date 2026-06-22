// Under vitest the `server-only` guard package resolves to its client variant,
// which throws on import. Server modules are exercised directly in the Node test
// environment, so we alias `server-only` to this empty stub (see vitest.config).
export {};
