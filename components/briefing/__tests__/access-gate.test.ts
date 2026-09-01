import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BriefingAccessGate } from "@/components/briefing/BriefingAccessGate";

describe("Briefing access gate", () => {
  it("keeps the access input available when the legacy preview window expired", () => {
    const markup = renderToStaticMarkup(
      createElement(BriefingAccessGate, { state: "expired" }),
    );

    expect(markup).toContain('id="briefing-secret"');
    expect(markup).toContain('name="secret"');
    expect(markup).toContain('inputMode="numeric"');
    expect(markup).toContain('maxLength="4"');
  });
});
