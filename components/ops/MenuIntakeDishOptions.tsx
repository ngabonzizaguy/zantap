import { formatRwf } from "@/lib/format";
import type { MenuItemAddOnGroup, MenuItemSizeOption } from "@/lib/types";

export function MenuIntakeDishOptions({
  sizeOptions,
  addOnGroups,
}: {
  sizeOptions?: MenuItemSizeOption[];
  addOnGroups?: MenuItemAddOnGroup[];
}) {
  if (!sizeOptions?.length && !addOnGroups?.length) return null;

  return (
    <div className="mt-4 grid gap-3 border-t border-hairline pt-4 sm:grid-cols-2">
      {sizeOptions?.length ? (
        <section aria-label="Submitted sizes">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted">
            Sizes
          </h4>
          <ul className="mt-2 space-y-2">
            {sizeOptions.map((option) => (
              <li
                key={option.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-surface-strong px-3 py-2 text-sm"
              >
                <span className="font-medium text-ink">{option.label}</span>
                <span className="text-right text-muted">
                  {formatRwf(option.priceRwf)}
                  {!option.isAvailable ? " · Unavailable" : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {addOnGroups?.length ? (
        <section aria-label="Submitted extras">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted">
            Extras
          </h4>
          <div className="mt-2 space-y-2">
            {addOnGroups.map((group) => (
              <div key={group.id} className="rounded-lg bg-surface-strong p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{group.name}</span>
                  <span className="text-[11px] text-muted">
                    {group.required ? "Required" : "Optional"} ·{" "}
                    {group.selection === "SINGLE"
                      ? "Choose one"
                      : group.maxSelections
                        ? `Choose up to ${group.maxSelections}`
                        : "Choose multiple"}
                  </span>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-body">
                  {group.choices.map((choice) => (
                    <li key={choice.id} className="flex justify-between gap-3">
                      <span>
                        {choice.label}
                        {!choice.isAvailable ? " · Unavailable" : ""}
                      </span>
                      <span className="text-muted">
                        {choice.priceRwf ? `+ ${formatRwf(choice.priceRwf)}` : "Included"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
