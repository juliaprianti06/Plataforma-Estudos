import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, LockKeyhole, LogIn, Mail, User, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type AuthMode = 'login' | 'signup'

type AuthDialogProps = {
  initialMode: AuthMode
  trigger: ReactNode
}

function AuthDialog({ initialMode, trigger }: AuthDialogProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const isSignup = mode === 'signup'

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (nextOpen) {
      setMode(initialMode)
      setShowPassword(false)
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setShowPassword(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void navigate({ to: '/dashboard' })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border-0 p-0 shadow-2xl sm:max-w-md">
        <div className="bg-primary px-8 pb-7 pt-8 text-primary-foreground">
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/15">
            {isSignup ? (
              <UserPlus className="size-6" aria-hidden="true" />
            ) : (
              <LogIn className="size-6" aria-hidden="true" />
            )}
          </div>
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {isSignup ? 'Crie seu espaço de estudos' : 'Boas-vindas de volta!'}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-primary-foreground/70">
              {isSignup
                ? 'Comece agora e evolua junto com a comunidade.'
                : 'Entre para continuar sua jornada de aprendizado.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-4 px-8 pb-8 pt-6" onSubmit={handleSubmit}>
          {isSignup && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground" htmlFor="signup-name">
                Nome completo
              </label>
              <div className="relative">
                <User
                  className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Como podemos chamar você?"
                  required
                  className="h-12 w-full rounded-xl border bg-background pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:ring-3 focus:ring-ring/15"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground" htmlFor={`${mode}-email`}>
              E-mail
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id={`${mode}-email`}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="seuemail@exemplo.com"
                required
                className="h-12 w-full rounded-xl border bg-background pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:ring-3 focus:ring-ring/15"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-semibold text-foreground" htmlFor={`${mode}-password`}>
                Senha
              </label>
              {!isSignup && (
                <button
                  type="button"
                  className="text-xs font-medium text-accent transition-colors hover:text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
              )}
            </div>
            <div className="relative">
              <LockKeyhole
                className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id={`${mode}-password`}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder={isSignup ? 'Crie uma senha' : 'Digite sua senha'}
                minLength={6}
                required
                className="h-12 w-full rounded-xl border bg-background px-11 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:ring-3 focus:ring-ring/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <EyeOff className="size-5" aria-hidden="true" />
                ) : (
                  <Eye className="size-5" aria-hidden="true" />
                )}
              </button>
            </div>
            {isSignup && (
              <p className="text-xs text-muted-foreground">Use pelo menos 6 caracteres.</p>
            )}
          </div>

          {isSignup ? (
            <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
              <input
                type="checkbox"
                name="terms"
                required
                className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary"
              />
              Li e concordo com os Termos de Uso e a Política de Privacidade.
            </label>
          ) : (
            <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
              <input
                type="checkbox"
                name="remember"
                className="size-4 rounded border-border accent-primary"
              />
              Lembrar de mim
            </label>
          )}

          <Button
            type="submit"
            className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/15"
          >
            {isSignup ? 'Criar minha conta' : 'Entrar'}
            {isSignup ? (
              <UserPlus className="ml-1 size-4" aria-hidden="true" />
            ) : (
              <LogIn className="ml-1 size-4" aria-hidden="true" />
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isSignup ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}{' '}
            <button
              type="button"
              onClick={() => changeMode(isSignup ? 'login' : 'signup')}
              className="font-semibold text-accent hover:underline"
            >
              {isSignup ? 'Fazer login' : 'Criar conta'}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function LoginDialog() {
  return (
    <AuthDialog
      initialMode="login"
      trigger={
        <button
          type="button"
          className="rounded-md px-1 py-2 text-lg font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:text-base"
        >
          Login
        </button>
      }
    />
  )
}

export function SignUpDialog() {
  return (
    <AuthDialog
      initialMode="signup"
      trigger={
        <button
          type="button"
          className="cursor-pointer rounded-full bg-primary px-10 py-3 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 max-sm:w-full"
        >
          Criar Conta
        </button>
      }
    />
  )
}
