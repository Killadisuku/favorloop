import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORIES } from '../data'
import { IconCamera } from '../icons'
import { useStore } from '../store'
import { Toast } from '../ui'
import type { Category, TimeEstimate } from '../types'

const times: TimeEstimate[] = ['5–15 min', '15–30 min', '30–60 min', '1–2 hours', 'Other']

export function Post() {
  const { postFavor, me } = useStore()
  const nav = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('Home')
  const [timeEstimate, setTime] = useState<TimeEstimate>('15–30 min')
  const [reward, setReward] = useState(2)
  const [photo, setPhoto] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  const publish = () => {
    const res = postFavor({ title, description, category, timeEstimate, reward })
    if (!res.ok) { setErr(res.error); setConfirm(false); return }
    nav(`/app/favor/${res.id}`)
  }
  return (
    <div>
      <p className="kicker">Create a favor</p>
      <h1 className="h1">What do you need help with?</h1>
      <p className="tiny">Balance: {me?.balance ?? 0} Favor Credits</p>
      <div className="field" style={{ marginTop: 16 }}><label>Title</label><input className="input" placeholder="Help me set up my Wi-Fi…" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="field"><label>Describe what you need…</label><textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div className="field"><label>Category</label><div className="filters">{CATEGORIES.map((c) => <button key={c} type="button" className={`chip ${category === c ? 'on' : ''}`} onClick={() => setCategory(c)}>{c}</button>)}</div></div>
      <div className="field"><label>Location</label><input className="input" value={`${me?.area || 'Nearby'}, ${me?.city || ''}`} readOnly /></div>
      <div className="field"><label>Estimated time</label><div className="filters">{times.map((t) => <button key={t} type="button" className={`chip ${timeEstimate === t ? 'on' : ''}`} onClick={() => setTime(t)}>{t}</button>)}</div></div>
      <div className="field"><label>Favor reward · {reward}</label><input type="range" min={1} max={10} value={reward} onChange={(e) => setReward(Number(e.target.value))} /><div className="tiny">1–10 community credits. Not cash.</div></div>
      <button className="btn btn-soft btn-block" type="button" onClick={() => setPhoto((p) => !p)}><IconCamera /> {photo ? 'Photo attached' : 'Add optional photo'}</button>
      <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setConfirm(true)}>Post Favor</button>
      {confirm && (
        <div className="modal-back" onClick={() => setConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="h2">Ready to post?</h2>
            <p>You are offering <b>{reward} Favor Credits</b> for this request. Credits only leave your wallet when the favor is completed.</p>
            <div className="row">
              <button className="btn btn-ghost" onClick={() => setConfirm(false)}>Edit</button>
              <button className="btn btn-primary" onClick={publish}>Publish</button>
            </div>
          </div>
        </div>
      )}
      <Toast text={err} />
    </div>
  )
}
