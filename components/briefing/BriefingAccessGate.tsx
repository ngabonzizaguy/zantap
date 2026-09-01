import Image from "next/image";
import { unlockBriefing } from "@/lib/briefing/access-actions";

interface BriefingAccessGateProps {
  error?: string;
  state?: "expired" | "unavailable";
}

export function BriefingAccessGate({ error, state }: BriefingAccessGateProps) {
  const unavailable = state === "unavailable";
  const expired = state === "expired";
  return (
    <main className="briefing-gate">
      <div className="briefing-gate__glow" aria-hidden />
      <section className="briefing-gate__card">
        <Image
          src="/brand/approved-z/zantap-wordmark-logo2-darkbg.png"
          alt="ZanTap"
          width={190}
          height={60}
          priority
          className="h-auto w-36"
        />
        <p className="briefing-kicker mt-12">Private briefing</p>
        <h1 className="mt-4 font-display text-[44px] font-normal leading-[0.98] tracking-[-0.03em] text-[#f6f1e8] sm:text-[58px]">
          A clearer way to see what ZanTap can become.
        </h1>
        <p className="mt-6 max-w-lg text-[15px] leading-7 text-white/58">
          This experience is prepared for invited viewers. Enter the four-digit
          PIN shared with you to continue.
        </p>

        {unavailable || expired ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm font-medium text-[#f4b04a]">
              {expired ? "This access window has expired." : "Preview access is not configured."}
            </p>
            <a
              href="mailto:hello@zantap.app?subject=ZanTap%20Briefing%20access"
              className="mt-4 inline-flex min-h-11 items-center text-sm text-white underline decoration-white/25 underline-offset-4"
            >
              Request access
            </a>
          </div>
        ) : null}

        <form action={unlockBriefing} className="mt-10">
          <label htmlFor="briefing-secret" className="briefing-label">
            Access PIN
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="briefing-secret"
              name="secret"
              type="password"
              required
              inputMode="numeric"
              pattern="[0-9]{4}"
              minLength={4}
              maxLength={4}
              autoComplete="one-time-code"
              className="briefing-secret-input"
              placeholder="4-digit PIN"
            />
            <button className="briefing-button shrink-0" type="submit">
              Enter briefing
            </button>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-[#ffb1a7]" role="alert">
              {error === "rate_limited"
                ? "Too many attempts. Wait 15 minutes, then try again."
                : "That PIN does not match this briefing."}
            </p>
          ) : null}
        </form>

        <p className="mt-12 text-[11px] uppercase tracking-[0.18em] text-white/30">
          Confidential · Do not record or redistribute
        </p>
      </section>
    </main>
  );
}
