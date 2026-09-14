import { Outlet, useLocation } from '@tanstack/react-router'
import { useEffect } from 'react'
import { sessionStore } from '@/auth/session'
import { useAuth } from '@/auth/use-auth'
import { AppLayout } from '@/components/layout/app-layout'

export function RootLayout() {
  const session = useAuth()
  const location = useLocation()
  const isLandingPage = location.pathname === '/'

  useEffect(() => {
    if (!session) return
    const checkExpiry = () => {
      if (session.expiresAt <= Date.now()) sessionStore.clear()
    }
    const timer = window.setInterval(checkExpiry, 1000)
    window.addEventListener('focus', checkExpiry)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', checkExpiry)
    }
  }, [session])

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
