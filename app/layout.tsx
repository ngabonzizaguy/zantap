import type { Metadata, Viewport } from "next";
import {
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
  Manrope,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PwaRuntime } from "@/components/pwa/PwaRuntime";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "ZanTap",
  description:
    "Low-friction social-commerce checkout and micro-POS for informal food vendors in Kigali.",
  applicationName: "ZanTap",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZanTap",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body antialiased" suppressHydrationWarning>
        {children}
        <PwaRuntime />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
