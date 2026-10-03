import { useParams } from '@tanstack/react-router'
import { GroupWorkspacePage } from './group-workspace'

export function GroupRoute() {
  const { groupId } = useParams({ from: '/groups/$groupId' })
  return <GroupWorkspacePage groupId={groupId} />
}
