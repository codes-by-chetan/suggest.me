import EditProfile from '@/features/edit-profile'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/profile/update-profile/')({
  component: EditProfile,
})


