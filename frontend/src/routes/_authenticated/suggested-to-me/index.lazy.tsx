import SuggestedToMe from '@/features/suggested-to-me'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/suggested-to-me/')({
  component: SuggestedToMe,
})

