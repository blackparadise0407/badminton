export default function Loading() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading page">
      <span className="sr-only">Loading page</span>
      <div className="h-7 w-40 animate-pulse rounded bg-line" />
      <div className="h-24 animate-pulse rounded-xl bg-line" />
      <div className="h-40 animate-pulse rounded-xl bg-line" />
    </div>
  );
}
