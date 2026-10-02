import { createFileRoute } from '@tanstack/react-router'
import Disciplinas from "../pages/disciplinas/index"

export const Route = createFileRoute('/disciplinas')({
  component: Disciplinas,
})