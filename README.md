# 🏟️ LeSifflet — Le verdict des supporters

Application communautaire de notation de matchs et joueurs de football.
Données en direct via API-Football.

---

## 📁 Structure du projet

```
lesifflet/
├── public/                       # Fichiers statiques
├── src/
│   ├── app/
│   │   ├── api/football/route.js # Proxy API sécurisé (clé cachée côté serveur)
│   │   ├── layout.js             # Layout global + SEO
│   │   └── page.js               # Page principale (toute l'app)
│   ├── components/
│   │   └── UI.js                 # Composants réutilisables
│   ├── data/
│   │   ├── footballApi.js        # Fonctions d'appel API-Football
│   │   ├── mockData.js           # Données de fallback
│   │   └── themes.js             # Thèmes clair/sombre
│   └── styles/
│       └── globals.css           # Styles globaux
├── next.config.js
├── package.json
└── README.md
```

---

## 🔑 Configuration API-Football

L'app utilise API-Football pour les vrais matchs. La clé API est stockée en variable d'environnement (jamais dans le code).

### Sur Vercel (production) :
1. Projet lesifflet → Settings → Environment Variables
2. Ajouter : `API_FOOTBALL_KEY` = ta clé
3. Redéployer

### En local (développement) :
Créer un fichier `.env.local` à la racine :
```
API_FOOTBALL_KEY=ta_cle_api_ici
```

---

## 🚀 Mise à jour du site

1. Ouvrir **GitHub Desktop**
2. Les fichiers modifiés apparaissent dans **Changes**
3. Écrire un résumé (ex: "Ajout API Football")
4. Cliquer **Commit to main** puis **Push origin**
5. Vercel redéploie automatiquement en ~1 min

---

## 🛠️ Développement local

```bash
npm install
npm run dev
```
Ouvrir http://localhost:3000

---

## 📄 Licence

Projet privé — © LeSifflet 2026
