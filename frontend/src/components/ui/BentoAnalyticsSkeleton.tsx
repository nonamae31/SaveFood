interface BentoAnalyticsSkeletonProps {
  analyticsLevel?: number
}

export function BentoAnalyticsSkeleton({ analyticsLevel = 0 }: BentoAnalyticsSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto animate-pulse">
      {/* Revenue Chart block: 2x2 — only for Plus+ */}
      {analyticsLevel >= 1 && (
        <div className="md:col-span-2 md:row-span-2 bg-gray-100 rounded-2xl p-6 min-h-[320px]">
          <div className="h-5 bg-gray-200 rounded-full w-48 mb-6" />
          <div className="h-full flex items-end justify-between gap-2 px-4 pb-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-gray-200 rounded-t-md"
                style={{ height: `${30 + Math.random() * 60}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Products block: 1x2 — only for Plus+ */}
      {analyticsLevel >= 1 && (
        <div className="md:col-span-1 md:row-span-2 bg-gray-100 rounded-2xl p-6 min-h-[320px]">
          <div className="h-5 bg-gray-200 rounded-full w-40 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                  <div className="h-4 bg-gray-200 rounded-full w-28" />
                </div>
                <div className="h-4 bg-gray-200 rounded-full w-8" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue stat */}
      <div className="bg-gray-100 rounded-2xl p-6 min-h-[120px]">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="h-5 bg-gray-200 rounded-full w-14" />
        </div>
        <div className="h-3 bg-gray-200 rounded-full w-24 mb-2" />
        <div className="h-7 bg-gray-200 rounded-full w-32" />
      </div>

      {/* Orders stat */}
      <div className="bg-gray-100 rounded-2xl p-6 min-h-[120px]">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="h-5 bg-gray-200 rounded-full w-14" />
        </div>
        <div className="h-3 bg-gray-200 rounded-full w-24 mb-2" />
        <div className="h-7 bg-gray-200 rounded-full w-20" />
      </div>

      {/* Return Rate stat — only for Premium */}
      <div className="bg-gray-100 rounded-2xl p-6 min-h-[120px]">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
        </div>
        <div className="h-3 bg-gray-200 rounded-full w-28 mb-2" />
        <div className="h-7 bg-gray-200 rounded-full w-16" />
      </div>
    </div>
  )
}
