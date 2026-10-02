import { useState } from 'react'
import { getProfileStore } from '@/profile/use-profile'
import { Download, KeyRound, RotateCcw, ShieldCheck } from 'lucide-react'
import type { AuthSession } from '@/auth/types'
import { Button } from '@/components/ui/button'

export function AccountPanel({ session, onReset }: { session: AuthSession; onReset: () => void }) {
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  async function download() {
    if (downloading) return
    setDownloading(true)
    setDownloadError('')
    try {
      const payload = await getProfileStore(session).export()
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'meu-perfil-mindspace.json'
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (cause) {
      setDownloadError(cause instanceof Error ? cause.message : 'Não foi possível baixar o perfil.')
    } finally { setDownloading(false) }
  }

  return (
    <div className="space-y-6 p-5 sm:p-7">
      <div>
        <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-muted text-accent"><ShieldCheck className="size-5" /></span>
        <h2 className="text-lg font-semibold text-primary">Sua conta e seus dados</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Informações de acesso e controle da sua personalização.</p>
      </div>
      <div className="rounded-xl border p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Conectado como</p>
        <p className="mt-2 break-all text-sm font-semibold text-primary">{session.user.email}</p>
        <span className="mt-3 inline-flex rounded-full bg-muted px-2.5 py-1 text-[10px] text-accent">{session.mode === 'mock' ? 'Conta de demonstração' : 'Sessão autenticada'}</span>
      </div>
      <section className="space-y-3 border-t pt-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary"><KeyRound className="size-4" /> Acesso à conta</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">{session.mode === 'mock' ? 'O login de demonstração não armazena nem verifica senhas. A alteração de senha e a exclusão de conta estarão disponíveis com o serviço de contas.' : 'A alteração de senha e a exclusão de conta ainda não estão disponíveis.'}</p>
        <Button type="button" variant="outline" disabled className="rounded-full text-xs">Alterar senha</Button>
      </section>
      <section className="space-y-3 border-t pt-5">
        <h3 className="text-sm font-semibold text-primary">Uma cópia do seu perfil</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">{session.mode === 'api' ? 'Baixe os dados e as preferências salvos na sua conta.' : 'Baixe os dados e as preferências que você salvou neste navegador.'}</p>
        <Button type="button" variant="outline" disabled={downloading} onClick={() => void download()} className="rounded-full text-xs"><Download className="size-3.5" /> {downloading ? 'Baixando...' : 'Baixar meu perfil'}</Button>
        {downloadError && <p role="alert" className="text-xs text-destructive-text">{downloadError}</p>}
      </section>
      <section className="space-y-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
        <h3 className="text-sm font-semibold text-foreground">Restaurar personalização</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">Remove a foto, a apresentação e as preferências salvas, e restaura o nome inicial. Seus grupos e seu acesso continuam disponíveis.</p>
        <Button type="button" variant="outline" onClick={onReset} className="rounded-full border-warning/30 bg-card text-xs text-foreground"><RotateCcw className="size-3.5" /> Restaurar meu perfil</Button>
      </section>
    </div>
  )
}
