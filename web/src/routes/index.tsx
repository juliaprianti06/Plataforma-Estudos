import { createFileRoute } from '@tanstack/react-router'

import MindSpaceLanding from '../pages/landing-page' 

export const Route = createFileRoute('/')({
  component: MindSpaceLanding,
})