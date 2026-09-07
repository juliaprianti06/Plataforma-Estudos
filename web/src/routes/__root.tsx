import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import { AppLayout } from '../components/layout/app-layout'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const location = useLocation()
  const isLandingPage = location.pathname === '/'

  return (
    <div className="min-h-screen bg-background text-foreground">
      {isLandingPage ? (
        <Outlet />
      ) : (
        <AppLayout>
          <Outlet />
        </AppLayout>
      )}
    </div>
  )
}