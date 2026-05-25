import { useWeeklyReview, acknowledgeWeeklyReview } from '../hooks/useWeeklyReview'
import type { LastReviewControls } from '../hooks/useLastReview'
import WeeklyReviewContent from './WeeklyReviewContent'
import { Skeleton } from './ui/Skeleton'

interface Props {
  controls: LastReviewControls
}

export default function WeeklyReviewPopup({ controls }: Props) {
  const { dismiss, snooze } = controls
  const { data, isPending, isError } = useWeeklyReview()

  const handleDismiss = async () => {
    try {
      await acknowledgeWeeklyReview()
    } catch {
    }
    dismiss()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-app border border-default rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-3 animate-fade-in">
        <div className="sticky top-0 z-10 bg-app/90 backdrop-blur-sm border-b border-default px-4 sm:px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-primary">
            {data ? `Weekly Review — ${data.week_label}` : 'Weekly Review'}
          </h2>
          <button
            onClick={dismiss}
            className="text-xs text-tertiary hover:text-secondary transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-4 sm:px-5 py-4">
          {isPending ? (
            <div className="space-y-3 animate-pulse">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-panel rounded-lg p-2.5">
                    <Skeleton className="h-2.5 w-full mb-1.5 rounded" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-32 w-full rounded" />
            </div>
          ) : isError || !data ? (
            <div className="text-xs text-tertiary text-center py-8">Failed to load review data</div>
          ) : (
            <WeeklyReviewContent data={data} />
          )}
        </div>

        <div className="sticky bottom-0 bg-app/90 backdrop-blur-sm border-t border-default px-4 sm:px-5 py-3 flex items-center justify-end gap-2">
          <button
            onClick={snooze}
            className="text-2xs text-tertiary hover:text-secondary transition-colors px-3 py-1.5 rounded-md border border-default/50"
          >
            Don't show again this week
          </button>
          <button
            onClick={handleDismiss}
            disabled={isPending}
            className="text-2xs font-medium text-white bg-accent-emerald hover:bg-accent-emerald/90 disabled:opacity-50 transition-colors px-4 py-1.5 rounded-md"
          >
            Mark as Reviewed
          </button>
        </div>
      </div>
    </div>
  )
}
