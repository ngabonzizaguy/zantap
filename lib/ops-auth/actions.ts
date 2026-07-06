"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  OPS_SESSION_COOKIE,
  verifyOpsLoginSecret,
} from "@/lib/ops-auth/session";

export async function loginOpsAction(formData: FormData): Promise<void> {
  const secret = String(formData.get("secret") ?? "");
  if (!verifyOpsLoginSecret(secret)) {
    redirect("/ops/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(OPS_SESSION_COOKIE, secret.trim(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/ops",
    maxAge: 60 * 60 * 12,
  });
  redirect("/ops");
}

export async function logoutOpsAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OPS_SESSION_COOKIE);
  redirect("/ops/login");
}
