export default function EventDetailsLoadingView() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6" aria-busy="true" aria-label="Loading event details">
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-10 w-40 rounded-md bg-slate-100" />
        <div className="h-4 w-32 rounded bg-slate-100" />
        <div className="h-10 w-36 rounded-md bg-slate-100" />
      </div>

      <div className="rounded-2xl bg-slate-200 p-6 shadow-md">
        <div className="h-9 w-56 rounded bg-slate-100/90" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="rounded-lg bg-white p-5 shadow-sm">
            <div className="h-4 w-20 rounded bg-slate-100" />
            <div className="mt-3 h-6 w-28 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <div className="h-4 w-24 rounded bg-slate-100" />
          <div className="mt-3 h-4 w-full rounded bg-slate-100" />
          <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />
        </div>

        <div className="rounded-lg bg-white p-5 shadow-sm">
          <div className="h-4 w-16 rounded bg-slate-100" />
          <div className="mt-3 h-5 w-32 rounded bg-slate-100" />
        </div>

        <div className="rounded-lg bg-white p-5 shadow-sm">
          <div className="h-4 w-16 rounded bg-slate-100" />
          <div className="mt-3 flex gap-2">
            <div className="h-8 w-16 rounded-full bg-slate-100" />
            <div className="h-8 w-20 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>

      <div className="h-72 rounded-2xl bg-slate-100 shadow-sm md:h-96 lg:h-[360px]" />
    </main>
  );
}
