import { acknowledgeBriefingAccess } from "@/lib/briefing/access-actions";

export function BriefingAcknowledgement({
  recipient,
  expiresAt,
}: {
  recipient: string;
  expiresAt: Date;
}) {
  return (
    <main className="briefing-gate">
      <div className="briefing-gate__glow" aria-hidden />
      <section className="briefing-gate__card">
        <p className="briefing-kicker">Viewer acknowledgement</p>
        <h1 className="mt-5 font-display text-4xl font-normal leading-none sm:text-6xl">
          Prepared for {recipient}.
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-7 text-white/60">
          This private ZanTap Briefing expires {expiresAt.toLocaleString("en-RW", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Africa/Kigali",
          })}. By continuing, you acknowledge that it is confidential and should
          not be recorded or redistributed.
        </p>
        <form action={acknowledgeBriefingAccess} className="mt-8">
          <button className="briefing-button" type="submit">
            I understand · Continue
          </button>
        </form>
      </section>
    </main>
  );
}
