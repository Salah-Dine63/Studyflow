import { useAuthStore } from '../stores/authStore'
import s from './DailyQuote.module.css'

const QUOTES = [
  { text: "Le succès, c'est tomber sept fois et se relever huit.", author: "Proverbe japonais" },
  { text: "L'éducation est l'arme la plus puissante pour changer le monde.", author: "Nelson Mandela" },
  { text: "Investis en toi-même. Ton éducation est la meilleure chose que tu puisses te payer.", author: "Benjamin Franklin" },
  { text: "La discipline, c'est choisir entre ce que tu veux maintenant et ce que tu veux le plus.", author: "Abraham Lincoln" },
  { text: "Chaque expert a d'abord été un débutant.", author: "Helen Hayes" },
  { text: "La connaissance est le seul bien qui s'accroît quand on le partage.", author: "Socrate" },
  { text: "Ne compte pas les jours, fais que les jours comptent.", author: "Muhammad Ali" },
  { text: "Le génie c'est 1% d'inspiration et 99% de transpiration.", author: "Thomas Edison" },
  { text: "Ce que tu fais aujourd'hui peut améliorer tous tes lendemains.", author: "Ralph Marston" },
  { text: "La persévérance est la clé de tout succès.", author: "Charlie Chaplin" },
  { text: "Commence là où tu es. Utilise ce que tu as. Fais ce que tu peux.", author: "Arthur Ashe" },
  { text: "Vous n'avez pas à être excellent pour commencer, mais vous devez commencer pour être excellent.", author: "Zig Ziglar" },
  { text: "L'apprentissage n'est pas un sprint, c'est un marathon.", author: "Anonyme" },
  { text: "Une heure de travail concentré vaut dix heures de distraction.", author: "Anonyme" },
  { text: "Tes efforts d'aujourd'hui sont les résultats de demain.", author: "Anonyme" },
  { text: "La concentration est la racine de toute capacité humaine.", author: "Bruce Lee" },
  { text: "Tout ce que l'esprit peut concevoir et croire, il peut le réaliser.", author: "Napoleon Hill" },
  { text: "Travaille dur en silence. Laisse ton succès faire le bruit.", author: "Frank Ocean" },
  { text: "Le seul endroit où le succès vient avant le travail, c'est dans le dictionnaire.", author: "Vidal Sassoon" },
  { text: "Sois toi-même le changement que tu veux voir dans le monde.", author: "Gandhi" },
  { text: "Si tu veux aller vite, marche seul. Si tu veux aller loin, marche ensemble.", author: "Proverbe africain" },
  { text: "La difficulté dans la vie, c'est de choisir.", author: "George Moore" },
  { text: "L'étude, c'est comme ramer à contre-courant : dès qu'on arrête, on recule.", author: "Anonyme" },
  { text: "Chaque session d'étude te rapproche de la version de toi que tu veux devenir.", author: "Anonyme" },
  { text: "La motivation te met en marche. L'habitude te fait avancer.", author: "Jim Ryun" },
  { text: "Rends-toi difficile à ignorer.", author: "Anonyme" },
  { text: "Ce n'est pas que c'est difficile qui nous empêche d'essayer. C'est parce qu'on n'essaie pas que c'est difficile.", author: "Sénèque" },
  { text: "La meilleure façon de prédire l'avenir, c'est de le créer.", author: "Peter Drucker" },
  { text: "Il n'y a pas d'ascenseur vers le succès. Il faut prendre les escaliers.", author: "Zig Ziglar" },
  { text: "Fais de ta vie un rêve, et d'un rêve une réalité.", author: "Antoine de Saint-Exupéry" },
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function getDailyQuote(userId?: string) {
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  const seed = userId ? hashString(userId + dateStr) : hashString(dateStr)
  return QUOTES[seed % QUOTES.length]
}

export default function DailyQuote() {
  const { user } = useAuthStore()
  const quote = getDailyQuote(user?.id)
  return (
    <div className={s.wrap}>
      <span className={s.icon}>✦</span>
      <div className={s.content}>
        <p className={s.text}>"{quote.text}"</p>
        <span className={s.author}>— {quote.author}</span>
      </div>
    </div>
  )
}
