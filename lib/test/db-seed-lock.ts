/**
 * Serializes Prisma test reseeds. The contract suite shares one remote
 * `zantap_test` schema; parallel `beforeEach` resets were racing deleteMany
 * chains and tripping foreign-key constraints.
 */
let chain: Promise<void> = Promise.resolve();

export function withSeedLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}
