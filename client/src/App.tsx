function App() {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_40%)]" />
      <section className="w-full max-w-3xl text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-400/10 text-3xl shadow-2xl shadow-violet-950/50">
          🦋
        </div>
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-violet-300">
          Butterfly Effect
        </p>
        <h1 className="text-balance text-5xl font-semibold tracking-tight text-white sm:text-7xl">
          One change. Infinite possibilities.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Explore how a single “what if?” could ripple through connected systems.
          This foundation is ready for the causal graph experience.
        </p>
        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left shadow-2xl shadow-black/20 backdrop-blur">
          <label htmlFor="scenario" className="text-sm font-medium text-slate-200">
            What would you like to explore?
          </label>
          <div className="mt-3 flex gap-3">
            <input
              id="scenario"
              disabled
              placeholder="What if…"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-300 outline-none placeholder:text-slate-600"
            />
            <button
              type="button"
              disabled
              className="rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white opacity-60"
            >
              Explore
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Scenario generation arrives in the next implementation phase.
          </p>
        </div>
      </section>
    </main>
  )
}

export default App
