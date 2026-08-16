import { Card } from "@/components/ui/primitives";
import type { MarketingInsights as Insights } from "@/lib/analytics/types";

export function MarketingInsights({ insights }: { insights: Insights }) {
  const metrics = [
    ["Visitors", insights.visitors],
    ["Lead-form views", insights.leadFormViews],
    ["Form starts", insights.leadFormStarts],
    ["Successful leads", insights.successfulLeads],
    ["Visitor → lead", `${insights.conversionRate}%`],
  ] as const;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display-sm font-light text-ink">Marketing insights</h1>
        <p className="mt-1 text-sm text-muted">Anonymous funnel activity from the last {insights.days} days. No contact or form values are stored here.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map(([label, value]) => <Card key={label} className="p-4"><p className="text-xs uppercase tracking-wide text-muted">{label}</p><p className="mt-2 font-display text-2xl font-light text-ink">{value}</p></Card>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Ranking title="Clicked actions" rows={insights.clicks.map((row) => [row.target, row.count])} />
        <Ranking title="Visitor languages" rows={insights.locales.map((row) => [row.locale.toUpperCase(), row.visitors])} />
        <Ranking title="Sources" rows={insights.sources.map((row) => [row.source, row.visitors])} />
      </div>
    </div>
  );
}

function Ranking({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  return <Card className="p-5"><h2 className="font-medium text-ink">{title}</h2><ol className="mt-4 space-y-3">{rows.slice(0, 10).map(([label, count]) => <li key={label} className="flex justify-between gap-4 text-sm"><span className="truncate text-body">{label}</span><strong className="text-ink">{count}</strong></li>)}{rows.length === 0 ? <li className="text-sm text-muted">No activity yet.</li> : null}</ol></Card>;
}
