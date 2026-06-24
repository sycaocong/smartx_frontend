import { Loader2 } from 'lucide-react'

export function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-text-muted">Loading...</span>
      </div>
    </div>
  )
}
