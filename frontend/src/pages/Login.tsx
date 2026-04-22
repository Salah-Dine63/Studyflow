import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuthStore } from '../stores/authStore'
import Logo from '../components/Logo'
import api from '../lib/api'
import s from './Auth.module.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loginWithOAuth, loading } = useAuthStore()
  const navigate = useNavigate()

  const handleGoogle = async (credential: string) => {
    try {
      const { data } = await api.post('/auth/google', { credential })
      loginWithOAuth(data.token, data.user)
      navigate('/')
    } catch {
      setError('Connexion Google échouée')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Connexion échouée')
    }
  }

  return (
    <div className={s.page}>

      {/* Left info panel */}
      <div className={s.panel}>
        <div className={s.panelLogo}><Logo size={52} /></div>
        <h2 className={s.panelTitle}>Study<span>Flow</span></h2>
        <p className={s.panelTagline}>
          L'app de productivité conçue pour les étudiants qui veulent progresser, session après session.
        </p>
        <ul className={s.features}>
          <li className={s.featureItem}>
            <span className={s.featureIcon}>⏱</span>
            Timer intelligent — Pomodoro, Deep Work, Sprint, Spaced
          </li>
          <li className={s.featureItem}>
            <span className={s.featureIcon}>📊</span>
            Statistiques détaillées sur chaque session d'étude
          </li>
          <li className={s.featureItem}>
            <span className={s.featureIcon}>🧠</span>
            Insights IA personnalisés pour optimiser ta méthode
          </li>
          <li className={s.featureItem}>
            <span className={s.featureIcon}>🏆</span>
            Système de points, niveaux et streak quotidien
          </li>
          <li className={s.featureItem}>
            <span className={s.featureIcon}>🔔</span>
            Alertes sonores et notifications de fin de session
          </li>
        </ul>
        <div className={s.panelStats}>
          <div className={s.panelStat}>
            <span className={s.panelStatVal}>4</span>
            <span className={s.panelStatLabel}>Techniques d'étude</span>
          </div>
          <div className={s.panelStat}>
            <span className={s.panelStatVal}>100%</span>
            <span className={s.panelStatLabel}>Gratuit</span>
          </div>
          <div className={s.panelStat}>
            <span className={s.panelStatVal}>∞</span>
            <span className={s.panelStatLabel}>Sessions</span>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className={s.formSide}>
        <div className={s.card}>
          <div className={s.logo}><Logo size={48} /></div>
          <h1 className={s.title}>Bon retour !</h1>
          <p className={s.sub}>Connecte-toi pour continuer à étudier</p>

          {error && <div className={s.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={s.form}>
            <div className={s.field}>
              <label className={s.label}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@example.com" required />
            </div>
            <div className={s.field}>
              <label className={s.label}>Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" required />
            </div>
            <button type="submit" className={s.btn} disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className={s.divider}><span>ou</span></div>

          <div className={s.socialWrap}>
            <GoogleLogin
              onSuccess={cr => cr.credential && handleGoogle(cr.credential)}
              onError={() => setError('Connexion Google échouée')}
              theme="filled_black"
              shape="rectangular"
              width="100%"
              text="signin_with"
            />
            <button className={s.appleBtn} disabled title="Nécessite un compte Apple Developer ($99/an)">
              <svg width="18" height="18" viewBox="0 0 814 1000" fill="currentColor"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49 188.3-49 30.5.1 107.9 5.2 158.3 56zM554.1 158.4c21.4-25.4 36.5-60.8 36.5-96.2 0-4.5-.3-9-.9-13.4-35 1.3-76.5 23.4-101.8 52.4-19.7 22.4-38.1 57.8-38.1 93.8 0 5.1.9 10.3 1.3 12 2.2.4 5.8.6 9.4.6 31.6 0 70.9-21.1 93.6-49.2z"/></svg>
              Continuer avec Apple
            </button>
          </div>

          <p className={s.switch}>Pas encore de compte ? <Link to="/register" className={s.link}>Créer un compte</Link></p>
        </div>
      </div>

    </div>
  )
}
