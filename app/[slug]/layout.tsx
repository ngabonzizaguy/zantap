import type { Metadata } from "next";
import { CUSTOMER_APP_METADATA } from "@/lib/pwa/customer-app";

interface StorefrontLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = CUSTOMER_APP_METADATA;

export default function StorefrontLayout({ children }: StorefrontLayoutProps) {
  return children;
}
