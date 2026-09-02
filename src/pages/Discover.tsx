import { useMemo, useState } from 'react'
import { CATEGORIES } from '../data'
import { useStore } from '../store'
import { FavorCard } from '../ui'
import type { Category } from '../types'

const sorts = ['Closest', 'Newest', 'Highest Reward', 'Quickest'] as const
const timeRank: Record<string, number> = {
  '5–15 min': 1, '15–30 min': 2, '30–60 min': 3, '1–2 hours': 4, Other: 5,
}

export function Discover() {
  const { openFavors, userById, me } = useStore()
  const [cat, setCat] = useState<'All' | 'Nearby' | Category>('All')
  const [sort, setSort] = useState<(typeof sorts)[number]>('Closest')
  const list = useMemo(() => {
    let rows = [...openFavors]
    if (cat === 'Nearby') rows = rows.filter((f) => f.distanceKm <= 1.5)
    else if (cat !== 'All') rows = rows.filter((f) => f.category === cat)
    rows.sort((a, b) => {
      if (sort === 'Closest') return a.distanceKm - b.distanceKm
      if (sort === 'Newest') return +new Date(b.createdAt) - +new Date(a.createdAt)
      if (sort === 'Highest Reward') return b.reward - a.reward
      return (timeRank[a.timeEstimate] ?? 9) - (timeRank[b.timeEstimate] ?? 9)
    })
    if (me?.plus) rows.sort((a, b) => Number(!!b.boostedUntil) - Number(!!a.boostedUntil))
    return rows
  }, [openFavors, cat, sort, me?.plus])
  return (
    <div>
      <div className="page-h"><div><p className="kicker">Nearby loop</p><h1 className="h1">Discover</h1></div></div>
      <div className="filters">
        {(['All', 'Nearby', ...CATEGORIES] as const).map((c) => (
          <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <div className="filters">
        {sorts.map((s) => (
          <button key={s} className={`chip ${sort === s ? 'on' : ''}`} onClick={() => setSort(s)}>{s}</button>
        ))}
      </div>
      {list.length === 0 && <div className="card empty">No open requests in this filter. Try All.</div>}
      {list.map((f) => {
        const author = userById(f.authorId)
        if (!author) return null
        return <FavorCard key={f.id} favor={f} author={author} cta="Offer Help" />
      })}
    </div>
  )
}
