// utils.ts
export function minutesBetween(inicio: string, termino: string): number {
  const [h1, m1] = inicio.split(":").map(Number);
  const [h2, m2] = termino.split(":").map(Number);
  return Math.max(0, h2 * 60 + m2 - (h1 * 60 + m1));
}

// 90 -> "1h30"
export function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}