import { useMemo, useState, type KeyboardEvent } from 'react'
import { createSessionRequest } from '@/api/session-request'
import { MIN_REGISTRATION_PASSWORD_LENGTH } from '@/auth/auth'
import type { AuthSession } from '@/auth/types'
import { Button } from '@/components/ui/button'

const field = 'w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-primary outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/10'

export function ChangePassword({ session }: { session: AuthSession }) {
  const request = useMemo(() => createSessionRequest(session), [session])
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function validate() {
    if (!current) return 'Informe sua senha atual.'
    if (next.length < MIN_REGISTRATION_PASSWORD_LENGTH) return `A nova senha deve ter pelo menos ${MIN_REGISTRATION_PASSWORD_LENGTH} caracteres.`
    if (next.length > 128) return 'A nova senha deve ter no máximo 128 caracteres.'
    if (next !== confirm) return 'A confirmação não é igual à nova senha.'
    if (next === current) return 'A nova senha precisa ser diferente da atual.'
    return ''
  }

  async function submit() {
    if (busy) return
    const problem = validate()
    setError(problem)
    setDone(false)
    if (problem) return
    setBusy(true)
    try {
      await request('post', '/auth/password', { currentPassword: current, newPassword: next })
      setCurrent(''); setNext(''); setConfirm('')
      setDone(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível alterar a senha.')
    } finally { setBusy(false) }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <div role="group" aria-labelledby="change-password-title" className="space-y-3" onKeyDown={onKeyDown}>
      <p id="change-password-title" className="sr-only">Alterar senha</p>
      <label className="block space-y-1.5 text-xs font-semibold text-primary">Senha atual
        <input type="password" autoComplete="current-password" className={field} value={current} onChange={event => setCurrent(event.target.value)} maxLength={128} disabled={busy} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5 text-xs font-semibold text-primary">Nova senha
          <input type="password" autoComplete="new-password" className={field} value={next} onChange={event => setNext(event.target.value)} maxLength={128} disabled={busy} aria-describedby="new-password-hint" />
        </label>
        <label className="block space-y-1.5 text-xs font-semibold text-primary">Confirmar nova senha
          <input type="password" autoComplete="new-password" className={field} value={confirm} onChange={event => setConfirm(event.target.value)} maxLength={128} disabled={busy} />
        </label>
      </div>
      <p id="new-password-hint" className="text-[10px] text-muted-foreground">Use pelo menos {MIN_REGISTRATION_PASSWORD_LENGTH} caracteres. Ao alterar, as sessões abertas em outros dispositivos serão encerradas.</p>
      {error && <p role="alert" className="text-xs text-destructive-text">{error}</p>}
      {done && <p role="status" className="text-xs text-success">Senha alterada. As outras sessões foram encerradas.</p>}
      <Button type="button" variant="outline" disabled={busy || !current || !next || !confirm} onClick={() => void submit()} className="rounded-full text-xs">{busy ? 'Alterando...' : 'Alterar senha'}</Button>
    </div>
  )
}
