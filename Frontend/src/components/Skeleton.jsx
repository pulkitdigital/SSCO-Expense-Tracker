const ROW_PILL_WIDTHS = [80, 120, 100, 100, 80];
const ROW_REPEAT_COUNT = 4;

function SkeletonCard() {
  return (
    <div className="h-[120px] w-full animate-pulse rounded-2xl bg-gray-200" />
  );
}

function SkeletonRow() {
  const pills = Array.from({ length: ROW_REPEAT_COUNT }, () => ROW_PILL_WIDTHS).flat();

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 py-3 last:border-0">
      {pills.map((width, index) => (
        <div
          key={index}
          className="h-4 animate-pulse rounded-full bg-gray-200"
          style={{ width: `${width}px` }}
        />
      ))}
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="h-[300px] w-full animate-pulse rounded-xl bg-gray-200" />
  );
}

export { SkeletonCard, SkeletonRow, SkeletonChart };
