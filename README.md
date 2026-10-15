# Portfolio de Nihed Zaoui

Structure :
- `index.html` : le site
- `api/chat.js` : fonction serveur du chatbot

## Déploiement sur Vercel
1. Crée un dépôt sur github.com et envoie-y tout le contenu de ce dossier (Add file > Upload files).
2. Sur vercel.com : Add New > Project > choisis le dépôt.
3. Avant de valider, dans Environment Variables, ajoute :
   - Nom : ANTHROPIC_API_KEY
   - Valeur : ta clé créée sur console.anthropic.com
4. Clique sur Deploy.

Optionnel : ANTHROPIC_MODEL pour changer de modèle (par défaut claude-haiku-5-5).
