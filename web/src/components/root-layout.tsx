import { Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { sessionStore } from '@/auth/session'
import { useAuth } from '@/auth/use-auth'

export function RootLayout() {
  const session = useAuth()
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
      <Outlet />
    </div>
  )
}
