import { CalendarDays } from 'lucide-react'
import { useLayout } from '@/components/layout/layout-context'
import { Button } from '@/components/ui/button'

export default function Calendario() {
  const { openMenu } = useLayout()

  return (
    <div className="mx-auto min-h-screen max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
      <header className="flex items-center gap-3">
        <Button aria-label="Abrir menu de navegação" className="lg:hidden" onClick={openMenu} size="icon" variant="outline">
          <CalendarDays aria-hidden="true" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendário</h1>
          <p className="text-sm text-muted-foreground">Sua agenda acadêmica</p>
        </div>
      </header>
    </div>
  )
}
