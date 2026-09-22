import { createFileRoute } from '@tanstack/react-router'
import Materiais from "../pages/materiais/index"

export const Route = createFileRoute('/materiais')({
  component: Materiais,
})
