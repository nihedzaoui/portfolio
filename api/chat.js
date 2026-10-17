// Vercel serverless function: calls the Groq API without exposing the key.
// The key is read from the GROQ_API_KEY environment variable (never in the code).
const PROFILE = `Nihed Zaoui, engineering student, Monastir (Tunisia). Email: nihedzaoui55@gmail.com, phone: +216 26 126 678. LinkedIn: https://www.linkedin.com/in/nihed-zaoui-466447337/ GitHub: https://github.com/nihedzaoui. Looking for a job or end-of-studies internship in applied AI, GenAI or data science.
EDUCATION: Engineering Degree in Applied Mathematics and Modeling + Master's Degree in Data Science (M2) at ENSIT Tunis (2024-present; ML, AI, statistics, optimization, numerical methods, probability, mathematical modeling). Preparatory engineering studies at IPEIM Monastir (2023-2024). ESSTHS Hammam Sousse (2022-2023; math, physics, OOP).
INTERNSHIPS: ItGate Tunisia (Sousse, hybrid): document automation with Groq OCR, LLMs, RAG, Python pipeline + FastAPI REST API. FlyRank AI (remote): ML workflows for search intelligence, feature engineering, pipelines, data contracts documentation. Smartovate (remote): RAG with Amazon Bedrock and OpenSearch Serverless, embeddings, semantic search. Mediwave Tunisia (Sousse, hybrid): hybrid recommendation of paramedical products, TF-IDF + cosine similarity, F1 = 0.80.
PROJECTS: Football match analyzer (YOLO, OpenCV: detection, tracking, teams, speed, distance, possession). Financial distress prediction (Scikit-learn, XGBoost, SMOTE, Power BI). Fall detection (accelerometer + gyroscope, ML).
SKILLS: Python, C, C++, Java, SQL, R, MATLAB, HTML/CSS, JavaScript; Scikit-learn, XGBoost, TensorFlow, Keras, PyTorch, PyTorch Lightning, OpenCV, YOLO; NumPy, Pandas, SciPy, Matplotlib, Seaborn, Plotly; LLMs, RAG, embeddings, semantic search, agentic pipelines; FastAPI, Flask, Streamlit, Docker, Git, GitHub Actions, AWS, Bedrock, Azure.
ACTIVITIES: Nerdata ENSIT, Geekshack ENSIT, Data Fest, Data Leaders, IEEE ENSIT Student Branch.`;

const SYSTEM = `You are the assistant of Nihed Zaoui's portfolio. Answer only from the information below and never invent anything. Speak about Nihed in the third person, in a warm and professional tone. Answer in 2 to 4 sentences of plain text, no markdown, in the visitor's language (English by default, or French if the visitor writes in French). If the information is not in the profile (salary, exact availability, private life...), say so and invite the visitor to write to nihedzaoui55@gmail.com. If the question has nothing to do with Nihed, politely steer the conversation back to her profile.\n\nPROFILE:\n${PROFILE}`;

// Simple rate limit: 15 messages per minute per IP (instance memory).
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 60000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 15;
}

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return res.status(429).json({ error: "Too many requests" });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: "Missing API key" });

  let messages = Array.isArray(req.body && req.body.messages) ? req.body.messages : [];
  messages = messages
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map(m => ({ role: m.role, content: m.content.slice(0, 600) }))
    .slice(-10);
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user")
    return res.status(400).json({ error: "Invalid messages" });

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        temperature: 0.4,
        ...(MODEL.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
        messages: [{ role: "system", content: SYSTEM }, ...messages]
      })
    });
    const data = await r.json();
    if (r.status === 429) return res.status(429).json({ error: "Too many requests" });
    if (!r.ok) {
      console.error("Groq error", r.status, JSON.stringify(data));
      return res.status(502).json({ error: "Upstream error", status: r.status, detail: data && data.error && data.error.message });
    }
    const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || "").trim();
    return res.status(200).json({ text: text || "I have no answer right now." });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
};
