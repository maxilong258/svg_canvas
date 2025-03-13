import { createLazyFileRoute } from '@tanstack/react-router'
import Tests from '@/features/tests'

export const Route = createLazyFileRoute('/_authenticated/tests/')({
  component: Tests,
})
