import { Card } from "@/components/ui/primitives";

export function OperatorContact() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card padding="lg" className="w-full max-w-md text-center">
        <h1 className="font-display text-display-sm text-ink">
          Vendor signup is not open
        </h1>
        <p className="mt-3 font-body text-body-md text-muted">
          New restaurant onboarding is handled by the ZanTap team. Contact your
          operator to get your setup code and storefront link.
        </p>
        <p className="mt-4 font-body text-body-sm text-muted-soft">
          Already have a storefront? Open your kitchen dashboard from the link
          your operator shared.
        </p>
      </Card>
    </div>
  );
}
