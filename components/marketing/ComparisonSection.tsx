import type { ReactElement } from "react";
import { COMPARISON as COMPARISON_EN } from "@/lib/marketing/copy";
import type { Localized } from "@/lib/i18n/localize";

const ICONS: Record<string, ReactElement> = {
  fees: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  platform: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72" />
    </svg>
  ),
  tracking: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  stock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
};

export function ComparisonSection({
  copy,
}: {
  copy?: Localized<typeof COMPARISON_EN>;
} = {}) {
  const COMPARISON = copy ?? COMPARISON_EN;
  return (
    <section className="border-t border-white/10 bg-[#0e0c0b]">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div data-mkt-reveal className="max-w-xl">
          <p className="font-body text-caption-uppercase uppercase text-[#f5a623]">
            {COMPARISON.kicker}
          </p>
          <h2 className="mt-3 font-display text-[34px] font-light leading-tight sm:text-[44px]">
            {COMPARISON.heading}
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {COMPARISON.rows.map((row) => (
            <article
              key={row.icon}
              data-mkt-reveal
              className="rounded-brand-xl border border-white/10 bg-white/[0.04] p-6"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-brand-lg bg-[#f5a623]/10 text-[#f5a623]">
                {ICONS[row.icon]}
              </div>
              <p className="font-body text-body-sm text-white/50 line-through decoration-white/25">
                {row.problem}
              </p>
              <p className="mt-2 font-body text-body-strong text-white">
                {row.solution}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
