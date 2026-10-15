// Fonction serveur Vercel : appelle l'API de Claude sans exposer la clé.
const PROFILE = `Nihed Zaoui, étudiante ingénieure, Monastir (Tunisie). Email: nihedzaoui55@gmail.com, tél: +216 26 126 678. LinkedIn: https://www.linkedin.com/in/nihed-zaoui-466447337/ GitHub: https://github.com/nihedzaoui. Recherche un poste ou stage de fin d'études en IA appliquée, GenAI ou data science.
FORMATION: Diplôme d'ingénieur en mathématiques appliquées et modélisation + Master en Data Science (M2) à l'ENSIT Tunis (2024-présent; ML, IA, statistiques, optimisation, méthodes numériques, probabilités, modélisation). Cycle préparatoire à l'IPEIM Monastir (2023-2024). ESSTHS Hammam Sousse (2022-2023; maths, physique, POO).
STAGES: ItGate Tunisia (Sousse, hybride): automatisation documentaire avec Groq OCR, LLM, RAG, pipeline Python + API FastAPI. FlyRank AI (à distance): workflows ML pour intelligence de recherche, feature engineering, pipelines, documentation des contrats de données. Smartovate (à distance): RAG avec Amazon Bedrock et OpenSearch Serverless, embeddings, recherche sémantique. Mediwave Tunisia (Sousse, hybride): recommandation hybride de produits paramédicaux, TF-IDF + cosinus, F1 = 0,80.
PROJETS: Analyseur de match de football (YOLO, OpenCV: détection, suivi, équipes, vitesse, distance, possession). Prédiction de faillite (Scikit-learn, XGBoost, SMOTE, Power BI). Détection de chutes (accéléromètre + gyroscope, ML).
COMPETENCES: Python, C, C++, Java, SQL, R, MATLAB, HTML/CSS, JavaScript; Scikit-learn, XGBoost, TensorFlow, Keras, PyTorch, PyTorch Lightning, OpenCV, YOLO; NumPy, Pandas, SciPy, Matplotlib, Seaborn, Plotly; LLM, RAG, embeddings, recherche sémantique, pipelines agentiques; FastAPI, Flask, Streamlit, Docker, Git, GitHub Actions, AWS, Bedrock, Azure.
ENGAGEMENTS: Nerdata ENSIT, Geekshack ENSIT, Data Fest, Data Leaders, IEEE ENSIT Student Branch.`;

const SYSTEM = `Tu es l'assistant du portfolio de Nihed Zaoui. Réponds uniquement à partir des informations ci-dessous, sans rien inventer. Parle de Nihed à la troisième personne, avec un ton chaleureux et professionnel. Réponds en 2 à 4 phrases, en texte simple sans markdown, dans la langue du visiteur (français ou anglais). Si l'information n'est pas dans le profil (salaire, disponibilité exacte, vie privée...), dis-le et invite le visiteur à écrire à nihedzaoui55@gmail.com. Si la question n'a aucun rapport avec Nihed, ramène poliment la conversation vers son profil.\n\nPROFIL:\n${PROFILE}`;

// Limitation simple : 15 messages par minute et par IP (mémoire de l'instance).
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 60000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 15;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return res.status(429).json({ error: "Too many requests" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "Missing API key" });

  let messages = Array.isArray(req.body && req.body.messages) ? req.body.messages : [];
  messages = messages
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map(m => ({ role: m.role, content: m.content.slice(0, 600) }))
    .slice(-10);
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user")
    return res.status(400).json({ error: "Invalid messages" });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
        max_tokens: 400,
        system: SYSTEM,
        messages
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: "Upstream error" });
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
    return res.status(200).json({ text: text || "Je n'ai pas de réponse pour le moment." });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
};
