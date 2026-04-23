import SeriesAccordion from './SeriesAccordion'

// Stages in display order (Finals first — most important match at the top)
const STAGE_ORDER = [
  'Finals', 'Grand Finals', 'Final',
  'Semifinals', 'Semi-Finals', 'Semifinal',
  'Quarterfinals', 'Quarter-Finals', 'Quarterfinal',
  'Round of 8', 'Round of 16', 'Round of 32',
  'Tiebreakers', 'Tiebreaker',
]

function normalizeStage(stage: string): string {
  if (/grand.?final/i.test(stage))   return 'Finals'
  if (/^final/i.test(stage))         return 'Finals'
  if (/semi.?final/i.test(stage))    return 'Semifinals'
  if (/quarter.?final/i.test(stage)) return 'Quarterfinals'
  if (/round of 8/i.test(stage))     return 'Round of 8'
  if (/round of 16/i.test(stage))    return 'Round of 16'
  if (/round of 32/i.test(stage))    return 'Round of 32'
  if (/tiebreaker/i.test(stage))     return 'Tiebreakers'
  return stage
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

  // Sort stages by defined order; unknown stages go last
  const sortedStages = [...grouped.keys()].sort((a, b) => {
    const ai = STAGE_ORDER.indexOf(a)
    const bi = STAGE_ORDER.indexOf(b)
    if (ai === -1 && bi === -1) return 0
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  return (
    <div className="flex flex-col gap-8">
      {sortedStages.map((stage) => {
        const stageMatches = grouped.get(stage)!
        const cols = GRID_COLS[stage] ?? 'grid-cols-1 sm:grid-cols-2'
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
