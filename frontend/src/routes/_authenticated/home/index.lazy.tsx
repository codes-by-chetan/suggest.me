import Home from '@/features/home'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/home/')({
  component: Home,
})
