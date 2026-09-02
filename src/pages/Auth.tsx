import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconLoop } from '../icons'
import { useStore } from '../store'

export function Login() {
  const { login, demoLogin } = useStore()
  const nav = useNavigate()
  const [email, setEmail] = useState('yasar@favorloop.app')
  const [password, setPassword] = useState('loop')
  const [err, setErr] = useState<string | null>(null)
  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="brand" style={{ padding: '0 0 12px' }}>
          <div className="brand-mark"><IconLoop size={18} /></div>
          <div className="brand-name">FavorLoop</div>
        </div>
        <h1 className="h1">Welcome back</h1>
        <p className="muted">Demo password for every seeded account: loop</p>
        <form onSubmit={(e) => { e.preventDefault(); const error = login(email, password); if (error) setErr(error); else nav('/app') }}>
          <div className="field"><label>Email</label><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="field"><label>Password</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {err && <p className="tiny" style={{ color: 'var(--bad)' }}>{err}</p>}
          <button className="btn btn-primary btn-block" type="submit">Log in</button>
        </form>
        <button className="btn btn-soft btn-block" style={{ marginTop: 10 }} onClick={() => { demoLogin(); nav('/app') }}>Continue as Yasar</button>
        <p className="tiny" style={{ marginTop: 14 }}>New here? <Link to="/signup">Create an account</Link></p>
      </div>
    </div>
  )
}

export function Signup() {
  const { signup } = useStore()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [city, setCity] = useState('Dubai')
  const [err, setErr] = useState<string | null>(null)
  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1 className="h1">Join FavorLoop</h1>
        <p className="muted">A few details. Then 3 starter credits.</p>
        <form onSubmit={(e) => { e.preventDefault(); const error = signup({ name, email, password, city }); if (error) setErr(error); else nav('/onboarding') }}>
          <div className="field"><label>Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label>Email</label><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="field"><label>Password</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div className="field"><label>City</label><input className="input" value={city} onChange={(e) => setCity(e.target.value)} /></div>
          {err && <p className="tiny" style={{ color: 'var(--bad)' }}>{err}</p>}
          <button className="btn btn-primary btn-block" type="submit">Continue</button>
        </form>
        <p className="tiny" style={{ marginTop: 14 }}>Already looping? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  )
}

const SKILL_OPTS = ['Tech setup', 'Home', 'Errands', 'English', 'Excel', 'Design', 'Moving', 'Driving', 'Photoshop']
const NEED_OPTS = ['Tech', 'Home', 'Errands', 'Learning', 'Transport', 'Creative']

export function Onboarding() {
  const { me, completeOnboarding } = useStore()
  const nav = useNavigate()
  const [area, setArea] = useState(me?.area || 'Marina')
  const [skills, setSkills] = useState<string[]>(me?.skills ?? [])
  const [needs, setNeeds] = useState<string[]>(me?.needHelpWith ?? [])
  const [hue, setHue] = useState(me?.avatarHue ?? 168)
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  useEffect(() => { if (!me) nav('/signup') }, [me, nav])
  if (!me) return null
  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <p className="kicker">Almost there</p>
        <h1 className="h1">Welcome to FavorLoop.</h1>
        <p className="muted">You start with 3 promotional starter credits.</p>
        <div className="field"><label>Neighborhood</label><input className="input" value={area} onChange={(e) => setArea(e.target.value)} /></div>
        <div className="field"><label>Profile color</label><input type="range" min={0} max={360} value={hue} onChange={(e) => setHue(Number(e.target.value))} /></div>
        <div className="field"><label>What can you help with?</label><div className="filters">{SKILL_OPTS.map((s) => <button key={s} type="button" className={`chip ${skills.includes(s) ? 'on' : ''}`} onClick={() => toggle(skills, setSkills, s)}>{s}</button>)}</div></div>
        <div className="field"><label>What might you need help with?</label><div className="filters">{NEED_OPTS.map((s) => <button key={s} type="button" className={`chip ${needs.includes(s) ? 'on' : ''}`} onClick={() => toggle(needs, setNeeds, s)}>{s}</button>)}</div></div>
        <button className="btn btn-primary btn-block" onClick={() => { completeOnboarding({ area, skills, needHelpWith: needs, photoHue: hue }); nav('/app') }}>Start looping</button>
      </div>
    </div>
  )
}
