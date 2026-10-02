import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function InviteCode({ code, draft = false }: { code: string; draft?: boolean }) {
  const [message, setMessage] = useState('')

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setMessage('Código copiado!')
    } catch {
      setMessage('Não foi possível copiar. Selecione o código e copie manualmente.')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted px-3 py-3">
        <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
          Código da sala:
          <input
            aria-label="Código da sala"
            readOnly
            value={code}
            onFocus={(event) => event.target.select()}
            className="w-[5.5rem] border-0 bg-transparent font-mono text-sm font-bold tracking-wider text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <Button type="button" variant="outline" size="sm" className="rounded-full border-accent bg-transparent text-[10px] text-accent" onClick={() => void copy()}>Copiar</Button>
      </div>
      {draft && <p className="text-[10px] text-muted-foreground">O código fica ativo após criar o grupo.</p>}
      {message && <p role="status" className="text-[11px] text-muted-foreground">{message}</p>}
    </div>
  )
}
