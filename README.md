# StudyFlow

Application de productivité étudiante avec timer, suivi de sessions et intelligence adaptative.

## Démarrage rapide

### 1. Ouvrir dans VSCode
Double-clique sur `studyflow.code-workspace`

### 2. Installer les dépendances
```bash
# Backend
cd backend
npm install

# Frontend (nouveau terminal)
cd frontend
npm install
```

### 3. Configurer l'environnement
```bash
cd backend
copy .env.example .env
```
Édite `backend/.env` si nécessaire (les valeurs par défaut fonctionnent avec Docker).

### 4. Lancer la base de données
```bash
docker-compose up -d
```

### 5. Créer les tables
```bash
cd backend
npm run migrate
```

### 6. Lancer l'application
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

L'app sera disponible sur **http://localhost:5173**

## Stack
- **Frontend** : React 18 + TypeScript + Vite + Zustand + Recharts
- **Backend** : Node.js + Express + TypeScript
- **Base de données** : PostgreSQL + Redis (via Docker)
