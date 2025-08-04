import FilePreview from '@/features/file-preview'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/file-preview/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <FilePreview/>
}
