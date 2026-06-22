// Client-safe MoMo constants. Kept separate from `simulate.ts` so client
// components (e.g. UssdModal) can use display copy without pulling the
// server-only Store into the browser bundle.
export const MOMO_SIM_VALID_PIN = "12345";
export const MOMO_SIM_PIN_HINT = `Use PIN ${MOMO_SIM_VALID_PIN} in sandbox mode.`;
