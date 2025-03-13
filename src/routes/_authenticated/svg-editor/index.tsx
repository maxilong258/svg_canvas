import SvgEditor from '@/features/svg-editor'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/svg-editor/')({
  component: SvgEditor,
})
