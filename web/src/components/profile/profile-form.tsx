import { useRef, useState, type ChangeEvent, type Dispatch, type SetStateAction } from 'react'
import { Camera, Check, Mail, Plus, UserRound } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { studyInterests, type ProfileInput, type StudyInterest } from '@/profile/store'
import { prepareProfilePhoto } from '@/profile/photo'

const fieldClass = 'w-full rounded-xl border border-border bg-card px-3.5 py-3 text-sm text-primary outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-3 focus:ring-ring/10'

export function ProfileForm({ draft, email, onChange, onPhotoBusy }: {
  draft: ProfileInput; email: string; onChange: Dispatch<SetStateAction<ProfileInput>>; onPhotoBusy: (busy: boolean) => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [photoError, setPhotoError] = useState('')
  const [uploading, setUploading] = useState(false)
  const initials = draft.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPhotoError('')
    setUploading(true)
    onPhotoBusy(true)
    try {
      const avatar = await prepareProfilePhoto(file)
      onChange((current) => ({ ...current, avatar }))
    } catch (cause) {
      setPhotoError(cause instanceof Error ? cause.message : 'Não foi possível carregar a foto.')
    } finally {
      setUploading(false)
      onPhotoBusy(false)
    }
  }

  function toggleInterest(interest: StudyInterest) {
    onChange({ ...draft, interests: draft.interests.includes(interest) ? draft.interests.filter((item) => item !== interest) : [...draft.interests, interest] })
  }

  return (
    <>
      <div className="relative h-24 overflow-hidden bg-muted sm:h-28" aria-hidden="true">
        <div className="absolute -right-10 -top-28 size-72 rounded-full border-[40px] border-accent/10" />
        <div className="absolute right-44 top-12 size-40 rounded-full border-[25px] border-card/35" />
        <div className="absolute left-6 top-5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground"><UserRound className="size-3.5" /> Seu espaço de estudante</div>
      </div>
      <div className="px-5 pb-6 sm:px-7">
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
          <div className="relative">
            <Avatar className="size-24 bg-card ring-[5px] ring-card">
              {draft.avatar && <AvatarImage src={draft.avatar} alt="Prévia da foto de perfil" />}
              <AvatarFallback className="bg-accent text-2xl font-semibold text-accent-foreground">{initials || <UserRound />}</AvatarFallback>
            </Avatar>
            <button type="button" aria-label="Alterar foto do perfil" disabled={uploading} onClick={() => fileInput.current?.click()} className="absolute -bottom-1 -right-1 z-10 grid size-8 place-items-center rounded-full border-[3px] border-card bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"><Camera className="size-3.5" /></button>
          </div>
          <div className="flex items-center gap-2 pb-1">
            {draft.avatar && <Button variant="ghost" type="button" disabled={uploading} className="text-xs text-muted-foreground" onClick={() => { setPhotoError(''); onChange({ ...draft, avatar: null }) }}>Remover foto</Button>}
            <Button type="button" variant="outline" disabled={uploading} className="rounded-full bg-card px-4 text-xs" onClick={() => fileInput.current?.click()}>{uploading ? 'Preparando...' : 'Alterar foto'}</Button>
          </div>
          <input ref={fileInput} id="profile-photo" type="file" accept="image/jpeg,image/png" className="sr-only" tabIndex={-1} aria-label="Selecionar foto de perfil" onChange={(event) => void upload(event)} />
        </div>
        <div className="mb-6 mt-4">
          <h2 className="break-words text-lg font-semibold tracking-tight text-primary">{draft.name.trim() || 'Seu perfil'}</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">JPG ou PNG, até 5 MB. A foto será ajustada para um formato quadrado.</p>
          {photoError && <p role="alert" className="mt-2 text-xs text-destructive-text">{photoError}</p>}
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="profile-name" className="text-xs font-semibold text-primary">Nome completo <span className="text-accent">*</span></label>
            <input id="profile-name" autoComplete="name" value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} className={fieldClass} required minLength={2} maxLength={100} placeholder="Como você quer ser chamado?" />
          </div>
          <div className="space-y-2">
            <label htmlFor="profile-email" className="text-xs font-semibold text-primary">E-mail de acesso</label>
            <div className="relative">
              <Mail aria-hidden="true" className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
              <input id="profile-email" value={email} readOnly type="email" className={cn(fieldClass, 'bg-background pl-10 text-muted-foreground')} aria-describedby="email-description" />
            </div>
            <p id="email-description" className="text-[10px] text-muted-foreground">Este é o e-mail usado para entrar. A alteração de e-mail ainda não está disponível.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="profile-bio" className="text-xs font-semibold text-primary">Sobre você <span className="font-normal text-muted-foreground">(opcional)</span></label>
              <span className="text-[10px] tabular-nums text-muted-foreground">{draft.bio.length}/300</span>
            </div>
            <textarea id="profile-bio" rows={3} maxLength={300} value={draft.bio} onChange={(event) => onChange({ ...draft, bio: event.target.value })} className={cn(fieldClass, 'resize-y')} placeholder="O que você está estudando? Compartilhe um pouco da sua jornada." />
          </div>
          <div className="space-y-3">
            <div>
              <h3 id="interests-label" className="text-xs font-semibold text-primary">Áreas de interesse</h3>
              <p className="mt-1 text-[10px] text-muted-foreground">Escolha até 3 assuntos que fazem parte dos seus estudos.</p>
            </div>
            <div role="group" aria-labelledby="interests-label" className="flex flex-wrap gap-2">
              {studyInterests.map((interest) => {
                const selected = draft.interests.includes(interest)
                return <button key={interest} type="button" aria-pressed={selected} disabled={!selected && draft.interests.length >= 3} onClick={() => toggleInterest(interest)} className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] transition focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40', selected ? 'border-accent/30 bg-accent/10 font-medium text-accent' : 'border-border text-muted-foreground hover:bg-muted')}>{selected ? <Check className="size-3" /> : <Plus className="size-3" />}{interest}</button>
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
