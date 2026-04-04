export default function TimelineLoadingView() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6" aria-busy="true" aria-label="Loading timeline">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-52 rounded bg-slate-200" />
          <div className="h-4 w-40 rounded bg-slate-100" />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <div className="h-9 w-16 rounded-full bg-slate-100" />
          <div className="h-9 w-20 rounded-full bg-slate-100" />
          <div className="h-9 w-24 rounded-full bg-slate-100" />
        </div>
      </header>

      <section className="relative">
        <div className="absolute bottom-0 left-8 top-0 w-px bg-gray-200/70" />

        <div className="space-y-8 pl-20">
          {Array.from({ length: 2 }, (_, yearIndex) => (
            <div key={yearIndex} className="space-y-5">
              <div className="h-4 w-12 rounded bg-slate-100" />

              {Array.from({ length: 2 }, (_, monthIndex) => (
                <div key={monthIndex} className="space-y-4">
                  <div className="h-4 w-14 rounded bg-slate-100" />

                  {Array.from({ length: 2 }, (_, eventIndex) => (
                    <article key={eventIndex} className="relative flex items-start gap-6">
                      <div className="absolute -left-12 top-10 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-slate-200" />
                      <div className="paper-card flex-1 space-y-4 p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="h-6 w-40 rounded bg-slate-200" />
                            <div className="h-4 w-44 rounded bg-slate-100" />
                          </div>

                          <div className="space-y-2">
                            <div className="h-4 w-20 rounded bg-slate-100" />
                            <div className="h-4 w-10 rounded bg-slate-100" />
                          </div>
                        </div>

                        <div className="h-4 w-full rounded bg-slate-100" />
                        <div className="h-4 w-5/6 rounded bg-slate-100" />

                        <div className="flex items-center gap-2">
                          <div className="h-8 w-16 rounded-full bg-slate-100" />
                          <div className="h-8 w-20 rounded-full bg-slate-100" />
                          <div className="ml-auto h-4 w-20 rounded bg-slate-100" />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
