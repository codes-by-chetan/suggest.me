import EditProfile from '@/features/profile/edit-profile/edit-profile'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/profile/update-profile/')({
  component: EditProfile,
})


