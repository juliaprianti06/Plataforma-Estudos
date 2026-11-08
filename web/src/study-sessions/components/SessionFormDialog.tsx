import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatDuration, minutesBetween } from "../utils";
import type { StudySession } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disciplinas: string[];
  onSubmit: (data: Omit<StudySession, "id">) => void;
};

export function SessionFormDialog({ open, onOpenChange, disciplinas, onSubmit }: Props) {
  const [disciplina, setDisciplina] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [inicio, setInicio] = useState("14:00");
  const [termino, setTermino] = useState("15:30");
  const [observacao, setObservacao] = useState("");

  const duracao = minutesBetween(inicio, termino);
  const invalido = !disciplina || duracao <= 0;

  function handleSave() {
    if (invalido) return;
    onSubmit({ disciplina, data, inicio, termino, observacao });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar sessão</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Disciplina</Label>
            <Select value={disciplina} onValueChange={setDisciplina}>
              <SelectTrigger><SelectValue placeholder="Selecione a disciplina..." /></SelectTrigger>
              <SelectContent>
                {disciplinas.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="data">Data</Label>
            <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inicio">Início</Label>
              <Input id="inicio" type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="termino">Término</Label>
              <Input id="termino" type="time" value={termino} onChange={(e) => setTermino(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Duração</Label>
            <p className="text-sm font-semibold text-indigo-600">
              {duracao > 0 ? formatDuration(duracao) : "—"}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="obs">Observação (opcional)</Label>
            <Textarea id="obs" placeholder="Adicione uma nota..." value={observacao}
              onChange={(e) => setObservacao(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={invalido}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}