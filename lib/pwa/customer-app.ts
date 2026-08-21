import type { Metadata } from "next";

export const CUSTOMER_APP_METADATA: Metadata = {
  applicationName: "ZanTap",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZanTap",
  },
};
