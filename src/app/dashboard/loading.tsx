export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-32 animate-pulse rounded-xl bg-white border border-gray-200" />
            <div className="h-12 animate-pulse rounded-xl bg-white border border-gray-200" />
            <div className="h-64 animate-pulse rounded-xl bg-white border border-gray-200" />
          </div>
          <div className="h-96 animate-pulse rounded-xl bg-white border border-gray-200" />
        </div>
      </main>
    </div>
  );
}
