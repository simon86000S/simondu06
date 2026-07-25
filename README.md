# Antigravity - Assistant Juridique FPT

Application de recherche juridique pour les agents de la Fonction Publique Territoriale (FPT) en France.

## 🎯 Objectif

Permettre aux agents territoriaux de trouver leurs droits en posant une question en langage naturel, avec des réponses basées **strictement** sur les textes officiels (Code général de la fonction publique, décrets).

## 🏗️ Architecture

```
UI (SearchInterface)
    ↓
API Route (/api/search)
    ↓
NLP Extraction (question → mots-clés juridiques)
    ↓
PISTE API (Légifrance) avec OAuth2
    ↓
Filtrage FPT strict (exclut privé, FPE, FPH)
    ↓
Formatage de réponse (résumé + références légales)
```

## 🚀 Installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Configurer les variables d'environnement**

Copiez `.env.example` vers `.env` et configurez vos clés API PISTE :

```bash
cp .env.example .env
```

Éditez `.env` avec vos credentials obtenus sur [https://piste.gouv.fr/](https://piste.gouv.fr/) :

```
PISTE_CLIENT_ID=votre_client_id
PISTE_CLIENT_SECRET=votre_client_secret
PISTE_TOKEN_URL=https://oauth.piste.gouv.fr/api/oauth/token
PISTE_API_BASE_URL=https://api.piste.gouv.fr
```

3. **Lancer l'application**

```bash
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 📁 Structure du projet

```
src/
├── app/
│   ├── api/
│   │   └── search/
│   │       └── route.ts          # API endpoint pour les recherches
│   ├── layout.tsx                # Layout principal
│   ├── page.tsx                  # Page d'accueil
│   └── globals.css               # Styles globaux
├── components/
│   └── SearchInterface.tsx       # Interface de recherche UI
├── services/
│   ├── pisteAuthService.ts       # Gestion OAuth2 PISTE
│   ├── pisteApiService.ts        # Connecteur API PISTE avec filtres FPT
│   ├── nlpExtractionService.ts   # Extraction NLP (langage naturel → juridique)
│   └── responseFormatter.ts      # Formatage des réponses pour les agents
└── types/
    └── index.ts                  # Types TypeScript
```

## 🔒 Filtrage FPT Strict

L'application applique des filtres stricts pour garantir que les résultats concernent uniquement la Fonction Publique Territoriale :

- **Exclut** : Code du travail (secteur privé)
- **Exclut** : Textes spécifiques à la Fonction Publique d'État (FPE)
- **Exclut** : Textes spécifiques à la Fonction Publique Hospitalière (FPH)
- **Inclut** : Code général de la fonction publique (commun aux trois versants)
- **Inclut** : Textes explicitement territoriaux (communes, départements, régions)

## 📝 Exemples de questions

- "Ai-je droit à des jours de fractionnement ?"
- "Quelles sont les conditions pour le congé parental ?"
- "Comment fonctionne la prime de précarité ?"
- "Quels sont mes droits à la formation ?"
- "Puis-je faire grève ?"

## 🔐 Sécurité

- Les identifiants API ne sont **jamais hardcodés**
- Utilisation obligatoire de variables d'environnement
- `.env` est exclu du versionning (voir `.gitignore`)

## 🛠️ Stack technique

- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS
- **HTTP Client** : Axios
- **API** : Légifrance PISTE (OAuth2)

## 📄 Licence

Projet développé pour la Fonction Publique Territoriale.
