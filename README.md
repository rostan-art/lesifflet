# 🏟️ LeSifflet — Le verdict des supporters

Application communautaire de notation de matchs et joueurs de football.

---

## 🚀 Déployer sur Vercel (en 10 minutes, gratuit)

### Étape 1 : Créer un compte GitHub (si tu n'en as pas)

1. Va sur **https://github.com** et clique **Sign up**
2. Crée un compte avec ton email
3. Confirme ton email

### Étape 2 : Mettre le code sur GitHub

1. Sur GitHub, clique le **+** en haut à droite → **New repository**
2. Nom : `lesifflet`
3. Laisse en **Public**, clique **Create repository**
4. Tu vas voir une page avec des instructions — on va y revenir

**Option A — Via l'interface GitHub (le plus simple) :**
1. Sur ta page de repo vide, clique **"uploading an existing file"**
2. Fais glisser TOUS les fichiers et dossiers du projet dans la zone
3. Clique **Commit changes**

**Option B — Via le terminal (si tu l'as installé) :**
```bash
cd lesifflet
git init
git add .
git commit -m "Premier commit LeSifflet"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/lesifflet.git
git push -u origin main
```

### Étape 3 : Déployer sur Vercel

1. Va sur **https://vercel.com** et clique **Sign Up**
2. Choisis **"Continue with GitHub"** (connecte ton compte GitHub)
3. Tu arrives sur le dashboard — clique **"Add New..."** → **"Project"**
4. Tu vas voir ton repo `lesifflet` — clique **Import**
5. **Framework Preset** : Vercel détecte automatiquement Next.js ✅
6. Clique **Deploy**
7. **Attends 1-2 minutes**... et c'est en ligne ! 🎉

Tu auras une URL du type : `https://lesifflet.vercel.app`

### Étape 4 : Connecter ton domaine (optionnel)

1. Achète `lesifflet.fr` sur **OVH** ou **Namecheap** (~10€/an)
2. Dans Vercel, va dans **Settings** → **Domains**
3. Ajoute `lesifflet.fr`
4. Vercel te donne des DNS à configurer chez ton registrar
5. Attends 24-48h pour la propagation DNS

---

## 📁 Structure du projet

```
lesifflet/
├── public/                  # Fichiers statiques (favicon, images)
├── src/
│   ├── app/
│   │   ├── layout.js       # Layout global + SEO
│   │   └── page.js         # Page principale (toute l'app)
│   ├── components/
│   │   └── UI.js           # Composants réutilisables
│   ├── data/
│   │   ├── mockData.js     # Données de démo (matchs, joueurs...)
│   │   └── themes.js       # Thèmes clair/sombre
│   └── styles/
│       └── globals.css     # Styles globaux + animations
├── next.config.js
├── package.json
└── README.md
```

---

## 🛠️ Développement local (optionnel)

Si tu veux tester en local avant de déployer :

```bash
# Installer Node.js d'abord : https://nodejs.org (version LTS)
cd lesifflet
npm install
npm run dev
```

Puis ouvre **http://localhost:3000** dans ton navigateur.

---

## 📋 Prochaines étapes

1. ✅ Déployer sur Vercel
2. 🔲 Créer les comptes sociaux (@LeSifflet)
3. 🔲 Connecter une API football (Football-Data.org)
4. 🔲 Ajouter Firebase pour la base de données
5. 🔲 Lancer sur un premier match

---

## 📄 Licence

Projet privé — © LeSifflet 2026
