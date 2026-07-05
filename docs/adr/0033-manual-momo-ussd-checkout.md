# Manual MTN MoMo USSD checkout (interim, pre-API)

Status: accepted

No MTN MoMo API exists yet. Production checkout replaces the simulated STK/PIN modal with a **manual MoMo payment** path: the Customer taps **Open MoMo** to dial a prefilled `*182#` USSD string (amount embedded), returns to the storefront, and self-confirms **I've paid** (honor system). Local dev keeps the sandbox STK flow unchanged (`MOMO_MODE=simulate` vs `manual` in production).

**USSD strings** (integer RWF amount, no separators): `*182*1*1*{localPhone}*{amount}#` when `payoutMethod=PHONE` (phone normalized to `078…`), `*182*8*1*{merchantCode}*{amount}#` when `payoutMethod=MERCHANT_CODE` (exactly six digits). Desktop: copy USSD, no dialer. Invalid vendor payout config blocks Pay before any Order is created.

**Lifecycle:** `placeOrder` → `PENDING` + `Payment PENDING` (`transactionRef: manual-{orderId}`). **I've paid** → `confirmManualPayment(orderId, customerPhone)` (phone must match order) → `PAID`. **Didn't pay**, 10-minute timeout, or late confirm after cancel → `abandonManualPayment(orderId, customerPhone)` → `Payment FAILED` + new `Order CANCELLED` status. Late **I've paid** on a cancelled order is rejected. Resume within the window via `sessionStorage`/`localStorage` or server lookup when the same phone is re-entered at checkout.

**Store seam:** new verbs `confirmManualPayment` and `abandonManualPayment`; sandbox `confirmPayment(ref, pin)` untouched. Cancelled orders appear in KDS History (filter + export) but never in the live queue or gross. Awaiting UI shows a live countdown.

**Considered:** orphan `PENDING` orders without `CANCELLED` (rejected — chose explicit `CANCELLED` + History visibility); auto-open dialer (rejected — tap **Open MoMo** first); confirm by `orderId` alone (rejected — require matching phone).
