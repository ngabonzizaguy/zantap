"use client";

import { useEffect, useRef, useState } from "react";

const MAX_CHARS = 300;

interface DescriptionClampProps {
  text: string;
}

export function DescriptionClamp({ text }: DescriptionClampProps) {
  const display = text.slice(0, MAX_CHARS);
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (expanded) return;
    const el = ref.current;
    if (!el) return;
    setNeedsToggle(el.scrollHeight > el.clientHeight + 1 || text.length > MAX_CHARS);
  }, [display, expanded, text.length]);

  const showToggle = needsToggle || expanded;

  return (
    <div className="mt-3 px-0.5">
      <p
        ref={ref}
        className={`text-[14px] font-medium leading-snug text-zt-warm ${
          expanded ? "" : "line-clamp-2"
        }`}
      >
        {display}
      </p>
      {showToggle && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1 text-[13px] font-semibold text-zt-accent-gold transition-colors hover:text-zt-accent"
        >
          {expanded ? "less" : "more"}
        </button>
      )}
    </div>
  );
}
