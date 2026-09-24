import { useLayout } from '@/components/layout/layout-context'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

export default function Progresso() {
  const { openMenu } = useLayout()

  return (
    <div className="mx-auto min-h-screen max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
      <header className="mb-6 flex items-center gap-3">
        <Button
          aria-label="Abrir menu de navegação"
          className="lg:hidden"
          onClick={openMenu}
          size="icon"
          variant="outline"
        >
          <Menu aria-hidden="true" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Progresso</h1>
          <p className="text-sm text-muted-foreground">Acompanhe suas atividades acadêmicas.</p>
        </div>
      </header>

      <section className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="font-medium">Resumo de progresso</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Os indicadores e gráficos serão adicionados nesta página na próxima etapa.
        </p>
      </section>
    </div>
  )
}
