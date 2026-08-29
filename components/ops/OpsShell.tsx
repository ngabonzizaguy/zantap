"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { logoutOpsAction } from "@/lib/ops-auth/actions";

const NAV = [
  { href: "/ops", label: "Vendors", icon: "inventory" as const },
  { href: "/ops/leads", label: "Leads", icon: "leads" as const },
  { href: "/ops/menu-intakes", label: "Menu intake", icon: "plate" as const },
  { href: "/ops/insights", label: "Insights", icon: "insights" as const },
  { href: "/ops/prospects", label: "Prospects", icon: "prospects" as const },
  { href: "/ops/recovery", label: "Recovery", icon: "clock" as const },
  { href: "/ops/briefing", label: "Briefing", icon: "eye" as const },
  { href: "/ops/settings", label: "Settings", icon: "settings" as const },
];

interface OpsShellProps {
  children: React.ReactNode;
}

export function OpsShell({ children }: OpsShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1 p-4">
      {NAV.map((item) => {
        const active =
          item.href === "/ops"
            ? pathname === "/ops"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setDrawerOpen(false)}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-ink text-on-primary"
                : "text-body hover:bg-surface-strong"
            )}
          >
            <Icon name={item.icon} size={20} strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
      <form action={logoutOpsAction} className="mt-4">
        <Button
          type="submit"
          variant="outline"
          className="h-9 w-full justify-start gap-2 px-4 text-sm"
        >
          <Icon name="close" size={18} />
          Sign out
        </Button>
      </form>
    </nav>
  );

  return (
    <div className="relative min-h-screen bg-canvas text-ink">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 border-r border-hairline bg-surface-card lg:block">
          <div className="flex items-center gap-2 border-b border-hairline px-4 py-5">
            <Image
              src="/brand/approved-z/zantap-z-mark-1024.png"
              alt="ZanTap"
              width={32}
              height={32}
            />
            <div>
              <p className="font-display text-sm font-light text-ink">Operator</p>
              <p className="text-xs text-muted">Platform console</p>
            </div>
          </div>
          {nav}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-hairline bg-surface-card/95 px-4 py-3 backdrop-blur lg:hidden">
            <button
              type="button"
              aria-label="Open menu"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-hairline"
              onClick={() => setDrawerOpen(true)}
            >
              <Icon name="menu" size={22} />
            </button>
            <p className="font-display text-sm font-light">Operator</p>
            <div className="w-11" />
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
            {children}
          </main>
        </div>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/30"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative h-full w-[min(280px,85vw)] bg-surface-card shadow-xl">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-4">
              <p className="font-display text-sm font-light">Menu</p>
              <button type="button" onClick={() => setDrawerOpen(false)}>
                <Icon name="close" size={22} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
