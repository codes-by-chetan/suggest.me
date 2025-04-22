/* eslint-disable @typescript-eslint/no-explicit-any */
import { createLazyFileRoute } from '@tanstack/react-router'
import ContentDetailsPage from '@/features/content-details'


export const Route = createLazyFileRoute(
  '/_authenticated/content/$id/'
)({
  component: ContentDetailsPage,
})
