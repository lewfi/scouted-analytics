'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const roleLabel: Record<string, string> = {
  top: 'Top', jungle: 'Jungle', mid: 'Mid', bot: 'Bot', support: 'Support',
}

interface Results {
  players: any[]
  teams: any[]
  tournaments: any[]
}

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<Results>({ players: [], teams: [], tournaments: [] })
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input and reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults({ players: [], teams: [], tournaments: [] })
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults({ players: [], teams: [], tournaments: [] })
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      const supabase = createClient()
      const q = `%${query}%`

      const [{ data: players }, { data: teams }, { data: tournaments }] = await Promise.all([
        supabase
          .from('players')
          .select('id, summoner_name, role, team:teams(name, slug)')
          .ilike('summoner_name', q)
          .limit(5),
        supabase
          .from('teams')
          .select('id, name, slug')
          .ilike('name', q)
          .limit(5),
        supabase
          .from('tournaments')
          .select('id, name')
          .ilike('name', q)
          .order('name')
          .limit(5),
      ])

      setResults({ players: players ?? [], teams: teams ?? [], tournaments: tournaments ?? [] })
      setLoading(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  if (!isOpen) return null

  const hasResults = results.players.length + results.teams.length + results.tournaments.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-zinc-500 shrink-0">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search players, teams, tournaments..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
          />
          {loading && (
            <div className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin shrink-0" />
          )}
          <kbd className="text-xs text-zinc-600 border border-zinc-700 rounded px-1.5 py-0.5 shrink-0">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query.length >= 2 ? (
            hasResults ? (
              <>
                {results.players.length > 0 && (
                  <section>
                    <p className="text-xs text-zinc-600 uppercase tracking-widest font-medium px-4 pt-3 pb-1">Players</p>
                    {results.players.map((p: any) => (
                      <Link
                        key={p.id}
                        href={`/players/${encodeURIComponent(p.summoner_name)}`}
                        onClick={onClose}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-800 transition-colors"
                      >
                        <span className="text-sm text-zinc-200">{p.summoner_name}</span>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span>{roleLabel[p.role] ?? p.role}</span>
                          <span>{(p.team as any)?.name}</span>
                        </div>
                      </Link>
                    ))}
                  </section>
                )}

                {results.teams.length > 0 && (
                  <section>
                    <p className="text-xs text-zinc-600 uppercase tracking-widest font-medium px-4 pt-3 pb-1">Teams</p>
                    {results.teams.map((t: any) => (
                      <Link
                        key={t.id}
                        href={`/teams/${t.slug}`}
                        onClick={onClose}
                        className="flex items-center px-4 py-2.5 hover:bg-zinc-800 transition-colors"
                      >
                        <span className="text-sm text-zinc-200">{t.name}</span>
                      </Link>
                    ))}
                  </section>
                )}

                {results.tournaments.length > 0 && (
                  <section>
                    <p className="text-xs text-zinc-600 uppercase tracking-widest font-medium px-4 pt-3 pb-1">Tournaments</p>
                    {results.tournaments.map((t: any) => (
                      <Link
                        key={t.id}
                        href={`/tournaments/${encodeURIComponent(t.name)}`}
                        onClick={onClose}
                        className="flex items-center px-4 py-2.5 hover:bg-zinc-800 transition-colors"
                      >
                        <span className="text-sm text-zinc-200">{t.name}</span>
                      </Link>
                    ))}
                  </section>
                )}
              </>
            ) : (
              !loading && (
                <p className="text-sm text-zinc-600 px-4 py-5">No results for &quot;{query}&quot;</p>
              )
            )
          ) : (
            <p className="text-xs text-zinc-600 px-4 py-4">Type at least 2 characters to search</p>
          )}
        </div>
      </div>
    </div>
  )
}
