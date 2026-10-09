import { useState, type FormEvent } from 'react'

const examples = [
  'What if the internet stopped working worldwide for 30 days?',
  'What if universities stopped using written exams?',
  'What if a major city banned private cars?',
]

type Props = {
  loading: boolean
  error: string | null
  initialScenario?: string
  onSubmit: (scenario: string) => void
}

export function ScenarioComposer({ loading, error, initialScenario = '', onSubmit }: Props) {
  const [scenario, setScenario] = useState(initialScenario)
  const trimmed = scenario.trim()
  const validationMessage = scenario.length > 500 ? 'Keep your scenario to 500 characters or fewer.' : null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!trimmed || validationMessage || loading) return
    onSubmit(trimmed)
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-7">
      <label htmlFor="scenario" className="block text-left text-sm font-semibold text-slate-100">
        What would you like to explore?
      </label>
      <textarea
        id="scenario"
        value={scenario}
        onChange={(event) => setScenario(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            event.currentTarget.form?.requestSubmit()
          }
        }}
        rows={3}
        disabled={loading}
        placeholder="What if…"
        aria-describedby="scenario-help scenario-error"
        className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15 disabled:cursor-wait"
      />
      <div id="scenario-help" className="mt-2 flex justify-between text-xs text-slate-500">
        <span>Press Enter to explore · Shift+Enter for a new line</span>
        <span className={scenario.length > 500 ? 'text-rose-300' : ''}>{scenario.length}/500</span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" aria-label="Example scenarios">
        {examples.map((example, index) => (
          <button
            key={example}
            type="button"
            disabled={loading}
            onClick={() => setScenario(example)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-xs text-slate-300 transition hover:border-violet-400/50 hover:bg-violet-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:opacity-50"
          >
            {index + 1}. {example.replace(/^What if /, '')}
          </button>
        ))}
      </div>

      {(validationMessage || error) && (
        <div id="scenario-error" role="alert" className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-left text-sm text-rose-200">
          {validationMessage ?? error}
        </div>
      )}

      <button
        type="submit"
        disabled={!trimmed || Boolean(validationMessage) || loading}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3.5 font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <><span className="loading-orbit" /> Mapping consequences…</> : 'Explore consequences'}
      </button>
      {loading && <p role="status" className="mt-3 text-sm text-slate-400">Building and checking your graph. Some scenarios take a little longer.</p>}
    </form>
  )
}
