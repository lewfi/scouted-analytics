import SeriesAccordion from './SeriesAccordion'

function normalizeStage(stage: string): string {
  if (/grand.?final/i.test(stage))      return 'Finals'
  if (/^final/i.test(stage))            return 'Finals'
  if (/semi.?final/i.test(stage))       return 'Semifinals'
  if (/quarter.?final/i.test(stage))    return 'Quarterfinals'
  if (/round of 8/i.test(stage))        return 'Round of 8'
  if (/round of 16/i.test(stage))       return 'Round of 16'
  if (/round of 32/i.test(stage))       return 'Round of 32'
  if (/tiebreaker/i.test(stage))        return 'Tiebreakers'
  if (/qualification/i.test(stage))     return 'Qualification'
  return stage
}

// Returns a sort index — lower = displayed first (earlier rounds first, Finals last)
function stageIndex(stage: string): number {
  const fixed: Record<string, number> = {
    'Round of 32': 0, 'Round of 16': 1, 'Round of 8': 2,
    'Quarterfinals': 3, 'Semifinals': 4, 'Finals': 5,
    'Tiebreakers': 6, 'Qualification': 7,
  }
  if (fixed[stage] !== undefined) return fixed[stage]
  // "Round N" format (LCK playoffs / EWC groups): lower round number = earlier display
  const m = stage.match(/^round\s+(\d+)$/i)
  if (m) return parseInt(m[1])
  return 999
}

const GRID_COLS: Record<string, string> = {
  'Finals':        'grid-cols-1 max-w-lg mx-auto',
  'Semifinals':    'grid-cols-1 sm:grid-cols-2',
  'Quarterfinals': 'grid-cols-1 sm:grid-cols-2',
  'Round of 8':    'grid-cols-1 sm:grid-cols-2',
  'Round of 16':   'grid-cols-1 sm:grid-cols-2',
  'Round of 32':   'grid-cols-1 sm:grid-cols-2',
}

export default function BracketView({ matches }: { matches: any[] }) {
  const grouped = new Map<string, any[]>()

  for (const m of matches) {
    const key = m.stage ? normalizeStage(m.stage) : 'Matches'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(m)
  }

  const sortedStages = [...grouped.keys()].sort((a, b) => stageIndex(a) - stageIndex(b))

  return (
    <div className="flex flex-col gap-8">
      {sortedStages.map((stage) => {
        const stageMatches = grouped.get(stage)!
        const cols = GRID_COLS[stage] ?? (/^round \d/i.test(stage) ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')
        const isFinal = stage === 'Finals'

        return (
          <div key={stage}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xs text-zinc-500 uppercase tracking-widest font-medium">{stage}</h3>
              {isFinal && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
              <div className="flex-1 h-px bg-zinc-800/60" />
            </div>
            <div className={`grid gap-2 ${cols}`}>
              {stageMatches.map((match: any) => (
                <SeriesAccordion key={match.id} match={match} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
