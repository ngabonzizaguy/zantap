import { GradientOrbs } from "@/components/ui/primitives";
import { Button, Card, Input } from "@/components/ui/primitives";
import { loginOpsAction } from "@/lib/ops-auth/actions";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function OpsLoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <div className="relative min-h-screen bg-canvas text-ink">
      <GradientOrbs />
      <main className="relative z-[1] mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <Card className="p-8">
          <h1 className="font-display text-display-sm font-light tracking-tight text-ink">
            Operator sign in
          </h1>
          <p className="mt-2 text-sm text-muted">
            Platform console for ZanTap staff.
          </p>
          {error ? (
            <p className="mt-4 text-sm text-red-600">Invalid credentials.</p>
          ) : null}
          <form action={loginOpsAction} className="mt-6 space-y-4">
            <Input
              name="secret"
              type="password"
              placeholder="Operator UI secret"
              autoComplete="current-password"
              required
            />
            <Button type="submit" variant="primary" className="w-full min-h-11">
              Continue
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
