import { Outlet, useLocation } from '@tanstack/react-router'
import { GroupsPage } from './groups-page'

export function GroupsLayout() {
  const pathname = useLocation({ select: location => location.pathname })
  return pathname === '/groups' || pathname === '/groups/' ? <GroupsPage /> : <Outlet />
}
