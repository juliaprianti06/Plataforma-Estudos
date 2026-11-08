import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDuration, minutesBetween } from "../utils";
import type { StudySession } from "../types";

type Props = {
  sessions: StudySession[];
  onEdit: (s: StudySession) => void;
  onDelete: (id: number) => void;
};

export function SessionHistory({ sessions, onEdit, onDelete }: Props) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Histórico de sessões</h2>
      <p className="mb-3 text-xs text-muted-foreground">Últimas sessões registradas</p>

      <ul className="divide-y">
        {sessions.map((s) => (
          <li key={s.id} className="grid grid-cols-[1.5fr_1fr_auto_2fr_auto] items-center gap-4 py-3 text-sm">
            <span className="font-medium">{s.disciplina}</span>
            <span className="text-muted-foreground">{s.inicio} – {s.termino}</span>
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
              {formatDuration(minutesBetween(s.inicio, s.termino))}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {s.observacao || "Sem observações"}
            </span>
            <span className="flex gap-3">
              <button aria-label="Editar" onClick={() => onEdit(s)}><Pencil size={14} /></button>
              <button aria-label="Excluir" onClick={() => onDelete(s.id)}><Trash2 size={14} /></button>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}