import { useMemo, useState } from "react";
import { Bell, BookOpen, Calendar, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "./components/StatCard";
import { SessionFormDialog } from "./components/SessionFormDialog";
import { SessionHistory } from "./components/SessionHistory";
import { mockSessions } from "./mock-data";
import { formatDuration, minutesBetween } from "./utils";
import type { StudySession } from "./types";

const DISCIPLINAS = ["Matemática", "Português", "Ciências", "História", "Inglês"];

export function StudySessionsPage() {
  const [sessions, setSessions] = useState<StudySession[]>(mockSessions);
  const [dialogOpen, setDialogOpen] = useState(false);

  const totalMin = useMemo(
    () => sessions.reduce((acc, s) => acc + minutesBetween(s.inicio, s.termino), 0),
    [sessions],
  );

  const topDisciplina = useMemo(() => {
    const porDisciplina = new Map<string, number>();
    sessions.forEach((s) =>
      porDisciplina.set(s.disciplina, (porDisciplina.get(s.disciplina) ?? 0) + minutesBetween(s.inicio, s.termino)),
    );
    return [...porDisciplina.entries()].sort((a, b) => b[1] - a[1])[0];
  }, [sessions]);

  function handleCreate(data: Omit<StudySession, "id">) {
    setSessions((prev) => [{ ...data, id: Date.now() }, ...prev]);
  }

  return (
    <div className="space-y-6 p-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sessões de estudo</h1>
          <p className="text-sm text-muted-foreground">Registre e acompanhe seu tempo de estudo</p>
        </div>
        <div className="flex items-center gap-3">
          <Bell size={18} />
          <Button onClick={() => setDialogOpen(true)}>
            <Plus size={16} /> Registrar sessão
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Esta semana" value={formatDuration(totalMin)}
          hint={`${sessions.length} sessões`} icon={<Clock size={16} />} />
        <StatCard label="Este mês" value={formatDuration(totalMin)}
          hint={`${sessions.length} sessões`} icon={<Calendar size={16} />} />
        <StatCard label="Disciplina mais estudada"
          value={topDisciplina ? topDisciplina[0] : "—"}
          hint={topDisciplina ? formatDuration(topDisciplina[1]) : undefined}
          icon={<BookOpen size={16} />} />
      </section>

      {/* TODO: <HoursPerDayChart /> e <TimeBySubject /> */}

      <SessionHistory
        sessions={sessions}
        onEdit={(s) => console.log("editar", s)}
        onDelete={(id) => setSessions((prev) => prev.filter((s) => s.id !== id))}
      />

      <SessionFormDialog open={dialogOpen} onOpenChange={setDialogOpen}
        disciplinas={DISCIPLINAS} onSubmit={handleCreate} />
    </div>
  );
}