import MySuggestions from '@/features/my-suggestions'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/my-suggestions/')({
  component: MySuggestions,
})

