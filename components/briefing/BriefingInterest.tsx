"use client";

import { useActionState, useEffect, useState } from "react";

import {
  submitBriefingInterestAction,
} from "@/lib/briefing/interest-actions";
import type { BriefingInterestActionState } from "@/lib/briefing/interest";

const INTERESTS = ["Vendor", "Investor", "Sponsor", "Partner", "Other"] as const;

export function BriefingInterest() {
  const [interest, setInterest] = useState<(typeof INTERESTS)[number]>("Partner");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const initialState: BriefingInterestActionState = { status: "idle" };
  const [state, formAction, pending] = useActionState(
    submitBriefingInterestAction,
    initialState
  );

  useEffect(() => {
    if (state.status !== "success") return;
    setName("");
    setContact("");
    setMessage("");
  }, [state.status]);

  return (
    <form action={formAction} className="briefing-interest">
      <input type="hidden" name="interestType" value={interest} />
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
          <input name="name" required value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          <span>Your email or phone</span>
          <input name="contact" required value={contact} onChange={(event) => setContact(event.target.value)} />
        </label>
        <label className="briefing-interest__message">
          <span>What would you like to explore?</span>
          <textarea
            name="message"
            required
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
      </div>
      <button disabled={pending} type="submit" className="briefing-button mt-5 inline-flex disabled:opacity-55">
        {pending ? "Saving…" : "Send to ZanTap"}
      </button>
      {state.message ? (
        <p role="status" className={`mt-3 text-xs leading-5 ${state.status === "error" ? "text-red-300" : "text-white/55"}`}>
          {state.message}
        </p>
      ) : (
        <p className="mt-3 text-xs leading-5 text-white/38">
          Recorded securely for private follow-up by the ZanTap team.
        </p>
      )}
    </form>
  );
}
