import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconLoop } from '../icons'
import { useStore } from '../store'

function IconEye({ off }: { off?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c4122f" strokeWidth="1.8">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 20 20 4" />}
    </svg>
  )
}

export function Login() {
  const { login, demoLogin, me } = useStore()
  const nav = useNavigate()
  const [email, setEmail] = useState('yasar@favorloop.app')
  const [password, setPassword] = useState('loop')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)

  useEffect(() => {
    if (me) nav('/app', { replace: true })
  }, [me, nav])

  const enter = (asDemo = false) => {
    if (asDemo) {
      demoLogin()
      nav('/app')
      return
    }
    const error = login(email, password)
    if (error) setErr(error)
    else nav('/app')
  }

  return (
    <div className="start-screen">
      <header className="start-top">
        <div className="start-brand">
          <div className="start-mark">
            <IconLoop size={18} />
          </div>
          <div>
            <div className="start-name">Por Favor</div>
            <div className="start-tag">Your time is currency</div>
          </div>
        </div>
        <button className="start-skip" type="button" onClick={() => enter(true)}>
          Skip
        </button>
      </header>

      <h1 className="start-title">Let's get started</h1>
      <p className="start-quiet">Don't have an account?</p>
      <Link className="start-register" to="/signup">
        Register now
      </Link>

      <form
        className="start-form"
        onSubmit={(e) => {
          e.preventDefault()
          enter(false)
        }}
      >
        <label className="start-label">Email or mobile number</label>
        <input
          className="start-input"
          value={email}
          autoComplete="username"
          placeholder="Enter your email or mobile number"
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="start-label">Password</label>
        <div className="start-pass">
          <input
            className="start-input"
            type={show ? 'text' : 'password'}
            value={password}
            autoComplete="current-password"
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="start-eye" type="button" onClick={() => setShow((s) => !s)} aria-label="Show password">
            <IconEye off={!show} />
          </button>
        </div>

        <label className="start-remember">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember me
        </label>

        {err && <p className="start-err">{err}</p>}
        {hint && <p className="start-hint">{hint}</p>}

        <button className="start-signin" type="submit">
          Sign in
        </button>
      </form>

      <button className="start-forgot" type="button" onClick={() => setHint('Demo password is loop')}>
        Forgot password?
      </button>

      <div className="start-or">
        <span>or sign in using</span>
      </div>

      <div className="start-socials">
        <button type="button" className="start-soc" aria-label="Apple" onClick={() => enter(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-1-3-1c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.3c1-.1 2-1.2 2.5-2.3-2.1-.8-2.8-3.1-2.8-3.9zM14.7 6.4c.6-.8 1.1-1.9.9-3-1 .1-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.3-.6 3-1.4z" />
          </svg>
        </button>
        <button type="button" className="start-soc" aria-label="Google" onClick={() => enter(true)}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.1 0 9.8-2 13.3-5.2l-6.1-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3.2 5.2-5.9 6.6l6.1 5.2C38.2 37.3 44 32 44 24c0-1.3-.1-2.5-.4-3.5z" />
          </svg>
        </button>
        <button type="button" className="start-soc" aria-label="Passkey" onClick={() => enter(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M12 3a4 4 0 0 1 2.2 7.3A6 6 0 0 1 18 16v1H6v-1a6 6 0 0 1 3.8-5.7A4 4 0 0 1 12 3z" />
            <path d="M9 21h6M10 18v3M14 18v3" />
          </svg>
        </button>
      </div>

      <div className="start-lang">English</div>
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
        <h1 className="h1">Join Por Favor</h1>
        <p className="muted">A few details. Then 3 starter credits.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const error = signup({ name, email, password, city })
            if (error) setErr(error)
            else nav('/onboarding')
          }}
        >
          <div className="field">
            <label>Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label>City</label>
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          {err && <p className="tiny" style={{ color: 'var(--bad)' }}>{err}</p>}
          <button className="btn btn-primary btn-block" type="submit">
            Continue
          </button>
        </form>
        <p className="tiny" style={{ marginTop: 14 }}>
          Already looping? <Link to="/login">Log in</Link>
        </p>
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

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  useEffect(() => {
    if (!me) nav('/signup')
  }, [me, nav])
  if (!me) return null

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <p className="kicker">Almost there</p>
        <h1 className="h1">Welcome to Por Favor.</h1>
        <p className="muted">You start with 3 promotional starter credits.</p>
        <div className="field">
          <label>Neighborhood</label>
          <input className="input" value={area} onChange={(e) => setArea(e.target.value)} />
        </div>
        <div className="field">
          <label>Profile color</label>
          <input
            type="range"
            min={0}
            max={360}
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>What can you help with?</label>
          <div className="filters">
            {SKILL_OPTS.map((s) => (
              <button
                key={s}
                type="button"
                className={`chip ${skills.includes(s) ? 'on' : ''}`}
                onClick={() => toggle(skills, setSkills, s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>What might you need help with?</label>
          <div className="filters">
            {NEED_OPTS.map((s) => (
              <button
                key={s}
                type="button"
                className={`chip ${needs.includes(s) ? 'on' : ''}`}
                onClick={() => toggle(needs, setNeeds, s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <button
          className="btn btn-primary btn-block"
          onClick={() => {
            completeOnboarding({ area, skills, needHelpWith: needs, photoHue: hue })
            nav('/app')
          }}
        >
          Start looping
        </button>
      </div>
    </div>
  )
}
