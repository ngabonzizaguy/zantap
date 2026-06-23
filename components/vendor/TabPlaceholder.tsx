import { Badge, Card } from "@/components/ui/primitives";

interface TabPlaceholderProps {
  title: string;
  description: string;
  badge?: string;
}

export function TabPlaceholder({ title, description, badge }: TabPlaceholderProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-mint opacity-40 blur-[48px]" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-gradient-lavender opacity-30 blur-[40px]" />
      <div className="relative">
        {badge ? (
          <Badge variant="muted" className="mb-3">
            {badge}
          </Badge>
        ) : null}
        <h2 className="font-display text-display-sm text-ink">{title}</h2>
        <p className="mt-2 font-body text-body-md text-body">{description}</p>
      </div>
    </Card>
  );
}
