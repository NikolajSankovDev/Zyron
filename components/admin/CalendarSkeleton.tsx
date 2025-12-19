/**
 * CalendarSkeleton - Modern loading skeleton for admin calendar
 * Features shimmer animation and light clean design
 */

export function CalendarSkeleton() {
  return (
    <div className="w-full h-full rounded-xl border border-gray-200 bg-white shadow-lg p-6 space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer bg-[length:200%_100%]" />
        <div className="h-10 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer bg-[length:200%_100%]" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-4 gap-4 h-[600px]">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            {/* Barber header skeleton */}
            <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />

            {/* Appointment cards skeleton */}
            <div className="space-y-2">
              {[...Array(8)].map((_, j) => (
                <div
                  key={j}
                  className="h-20 bg-gray-50 border border-gray-100 rounded-lg animate-pulse"
                  style={{ animationDelay: `${(i * 8 + j) * 0.05}s` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
