import MyWatchlist from '@/features/my-watchlist'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/my-watchlist/')({
  component: MyWatchlist,
})

