import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <h1 className="text-2xl font-bold font-heading text-foreground">
        Área de Estudos em Construção
      </h1>
    </div>
  ),
})