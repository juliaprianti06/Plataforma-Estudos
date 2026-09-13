import { createRootRoute } from '@tanstack/react-router'
import { auth } from '@/auth/auth'
import { RootLayout } from '@/components/root-layout'

export const Route = createRootRoute({
  beforeLoad: () => auth.restore(),
  component: RootLayout,
})
