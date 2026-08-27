"use client";

import { useState } from "react";

const INTERESTS = ["Vendor", "Investor", "Sponsor", "Partner", "Other"] as const;

export function BriefingInterest() {
  const [interest, setInterest] = useState<(typeof INTERESTS)[number]>("Partner");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const href = `mailto:hello@zantap.app?subject=${encodeURIComponent(
    `ZanTap Briefing — ${interest} interest`
  )}&body=${encodeURIComponent(
    `Name: ${name || "Not provided"}\nInterest: ${interest}\n\n${message}`
  )}`;

  return (
    <div className="briefing-interest">
      <div className="briefing-interest__types" role="group" aria-label="Interest type">
        {INTERESTS.map((option) => (
          <button
            type="button"
            key={option}
            aria-pressed={interest === option}
            onClick={() => setInterest(option)}
            className="briefing-interest__type"
          >
            {option}
          </button>
        ))}
      </div>
      <div className="briefing-interest__fields">
        <label>
          <span>Your name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          <span>What would you like to explore?</span>
          <textarea
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
      </div>
      <a href={href} className="briefing-button mt-5 inline-flex">
        Continue by email
      </a>
      <p className="mt-3 text-xs leading-5 text-white/38">
        Your email app will open with this message prepared. Nothing is sent
        until you choose to send it.
      </p>
    </div>
  );
}
