import SelfProfile from '@/features/profile/self-profile'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/profile/')({
  component: SelfProfile,
})
