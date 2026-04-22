import Logo from '../components/Logo'
import s from './About.module.css'

const FEATURES = [
  {
    icon: '⏱',
    title: 'Minuterie intelligente',
    desc: 'Pomodoro, 52/17, Deep Work ou une durée personnalisée — la minuterie s\'adapte à ta façon d\'étudier et sonne quand c\'est l\'heure de faire une pause.',
  },
  {
    icon: '👥',
    title: 'Sessions en groupe',
    desc: 'Étudie en temps réel avec tes amis. Le minuteur est synchronisé pour tout le monde via un code de salle partagé — comme une bibliothèque virtuelle.',
  },
  {
    icon: '📊',
    title: 'Tableau de bord & statistiques',
    desc: 'Visualise tes heures de focus, tes sessions complétées, ta série de jours actifs et ta progression vers ton objectif hebdomadaire.',
  },
  {
    icon: '🔥',
    title: 'Série & niveaux',
    desc: 'Gagne des points à chaque session, monte de niveau (Débutant → Légendaire) et maintiens ta série de jours actifs pour rester motivé.',
  },
  {
    icon: '✦',
    title: 'Insights IA',
    desc: 'Reçois des analyses personnalisées de tes habitudes d\'étude et des recommandations concrètes pour progresser davantage.',
  },
  {
    icon: '🎵',
    title: 'Ambiance sonore',
    desc: 'Pluie, océan, bruit blanc ou battements binauraux — des sons d\'ambiance scientifiquement reconnus pour améliorer la concentration.',
  },
  {
    icon: '🔍',
    title: 'Recherche d\'étudiants',
    desc: 'Trouve un camarade par son nom d\'utilisateur unique, consulte son profil public et lancez une session ensemble en un clic.',
  },
  {
    icon: '🌱',
    title: 'Carte thermique d\'activité',
    desc: 'Visualise chaque jour d\'effort sur les 112 derniers jours — une trace concrète de ta régularité et de ta progression.',
  },
]

const TECH = ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Socket.io', 'Vite']

export default function About() {
  return (
    <div className={s.page}>

      {/* Hero */}
      <div className={s.hero}>
        <div className={s.heroLogo}>
          <Logo size={64} />
        </div>
        <div className={s.heroText}>
          <h1 className={s.heroTitle}>StudyFlow</h1>
          <p className={s.heroSub}>La plateforme de productivité conçue <em>par</em> un étudiant, <em>pour</em> les étudiants.</p>
        </div>
      </div>

      {/* What is it */}
      <div className={s.card}>
        <h2 className={s.cardTitle}>Qu'est-ce que StudyFlow ?</h2>
        <p className={s.cardText}>
          StudyFlow est une application web de productivité pensée spécialement pour les étudiants.
          Elle combine un <strong>minuteur de focus</strong>, un <strong>système de suivi de progression</strong>,
          des <strong>sessions d'étude en groupe en temps réel</strong> et des <strong>analyses personnalisées</strong> —
          le tout dans une interface épurée et motivante.
        </p>
        <p className={s.cardText}>
          L'objectif est simple : t'aider à rester concentré, à mesurer tes efforts et à transformer
          chaque session d'étude en une habitude durable. Pas une simple horloge — un compagnon d'étude complet.
        </p>
      </div>

      {/* Features grid */}
      <div className={s.section}>
        <h2 className={s.sectionTitle}>Ce que StudyFlow t'apporte</h2>
        <div className={s.featGrid}>
          {FEATURES.map(f => (
            <div key={f.title} className={s.featCard}>
              <span className={s.featIcon}>{f.icon}</span>
              <h3 className={s.featTitle}>{f.title}</h3>
              <p className={s.featDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it helps */}
      <div className={s.card}>
        <h2 className={s.cardTitle}>Comment ça aide les étudiants ?</h2>
        <div className={s.helpList}>
          <div className={s.helpItem}>
            <span className={s.helpBullet}>01</span>
            <div>
              <strong>Combattre la procrastination</strong>
              <p>La méthode Pomodoro découpe le travail en blocs courts. Démarrer 25 minutes est toujours plus facile que "étudier toute la journée".</p>
            </div>
          </div>
          <div className={s.helpItem}>
            <span className={s.helpBullet}>02</span>
            <div>
              <strong>Maintenir la motivation sur le long terme</strong>
              <p>Les points, les niveaux et la série de jours actifs créent une boucle de récompense qui encourage la régularité plutôt que les révisions de dernière minute.</p>
            </div>
          </div>
          <div className={s.helpItem}>
            <span className={s.helpBullet}>03</span>
            <div>
              <strong>Étudier avec les autres, même à distance</strong>
              <p>Les sessions de groupe synchronisées recréent l'atmosphère d'une bibliothèque — travailler en présence virtuelle augmente la productivité.</p>
            </div>
          </div>
          <div className={s.helpItem}>
            <span className={s.helpBullet}>04</span>
            <div>
              <strong>Comprendre ses habitudes pour les améliorer</strong>
              <p>Les statistiques et insights IA révèlent tes patterns : quand tu es le plus productif, quelles matières te prennent le plus de temps, comment optimiser ta semaine.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Creator */}
      <div className={s.creatorCard}>
        <div className={s.creatorAvatar}>SD</div>
        <div className={s.creatorInfo}>
          <h2 className={s.creatorName}>Salah Din</h2>
          <span className={s.creatorTitle}>Ingénieur en Informatique · Créateur de StudyFlow</span>
          <p className={s.creatorText}>
            En tant qu'étudiant en informatique, j'ai vécu de près les défis de la concentration et de la gestion du temps.
            Les outils existants étaient soit trop simples (une simple horloge), soit trop complexes et impersonnels.
            J'ai voulu créer quelque chose de <strong>différent</strong> : une plateforme qui comprend vraiment la réalité
            d'un étudiant — les révisions tardives, les groupes de travail, les hauts et les bas de la motivation.
          </p>
          <p className={s.creatorText}>
            StudyFlow est né de cette conviction : <em>la technologie doit servir l'apprentissage humain,
            pas le compliquer.</em> Chaque fonctionnalité a été conçue en pensant à un vrai besoin,
            vécu par de vrais étudiants.
          </p>
        </div>
      </div>

      {/* Tech stack */}
      <div className={s.techCard}>
        <h2 className={s.cardTitle}>Stack technique</h2>
        <div className={s.techList}>
          {TECH.map(t => (
            <span key={t} className={s.techBadge}>{t}</span>
          ))}
        </div>
        <p className={s.techNote}>
          Application full-stack développée de A à Z — architecture REST + WebSocket temps réel,
          base de données relationnelle, authentification JWT et OAuth Google, interface réactive avec animations CSS.
        </p>
      </div>

      {/* Footer quote */}
      <div className={s.quoteBar}>
        <span className={s.quoteIcon}>✦</span>
        <p className={s.quoteText}>"Travaille dur en silence. Laisse ton succès faire le bruit."</p>
      </div>

    </div>
  )
}
