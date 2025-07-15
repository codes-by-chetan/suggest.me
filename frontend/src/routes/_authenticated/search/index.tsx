import SearchPage from '@/features/search'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/search/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <SearchPage/>
}
