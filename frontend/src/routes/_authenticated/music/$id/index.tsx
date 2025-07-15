import MusicDetailsPage from '@/features/content-details/music-details'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/music/$id/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <MusicDetailsPage/>
}
