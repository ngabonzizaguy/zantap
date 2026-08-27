import type { Metadata } from "next";
import "./briefing.css";

export const metadata: Metadata = {
  title: "ZanTap Briefing",
  description: "A private introduction to ZanTap.",
  robots: { index: false, follow: false, nocache: true },
};

export default function BriefingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
