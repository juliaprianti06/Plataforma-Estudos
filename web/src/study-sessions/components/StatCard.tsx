import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type Props = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ReactNode;
};

export function StatCard({ label, value, hint, icon }: Props) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span aria-hidden="true" className="rounded-md bg-muted p-1.5 text-accent">{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-primary">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
