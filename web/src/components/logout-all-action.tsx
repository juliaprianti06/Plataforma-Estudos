import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { MonitorX } from 'lucide-react'

import { auth } from '@/auth/auth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function LogoutAllAction() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleConfirm() {
    setPending(true)
    try {
      await auth.logoutAll()
    } catch {
      window.alert(
        'Sua sessão atual foi encerrada, mas não foi possível confirmar a saída dos outros dispositivos.',
      )
    } finally {
      setPending(false)
      setOpen(false)
      navigate({ to: '/' })
    }
  }

  return (
    <>
      <button
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
        onClick={() => setOpen(true)}
        type="button"
      >
        <MonitorX aria-hidden="true" className="size-3.5" />
        Sair de todos os dispositivos
      </button>
      <Dialog onOpenChange={(isOpen) => !pending && setOpen(isOpen)} open={open}>
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <MonitorX aria-hidden="true" className="size-5" />
            </div>
            <DialogTitle>Sair de todos os dispositivos?</DialogTitle>
            <DialogDescription>
              Todas as sessões desta conta serão encerradas, incluindo esta. Será necessário entrar novamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={pending} variant="outline">Cancelar</Button>
            </DialogClose>
            <Button disabled={pending} onClick={handleConfirm} variant="destructive">
              {pending ? 'Saindo...' : 'Sair de todos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
