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
        <span className="rounded-md bg-indigo-50 p-1.5 text-indigo-600">{icon}</span>
      </div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}