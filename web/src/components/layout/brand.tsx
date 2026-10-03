import { BrainCircuit } from 'lucide-react'

export function Brand() {
  return (
    <div className="flex items-center gap-2 text-sidebar-foreground" aria-label="MindSpace">
      <span className="grid size-8 place-items-center rounded-xl bg-sidebar-accent">
        <BrainCircuit aria-hidden="true" className="size-4.5" strokeWidth={1.8} />
      </span>
      <span className="font-heading text-[17px] font-bold tracking-[-0.03em]">
        MindSpace.
      </span>
    </div>
  )
}
