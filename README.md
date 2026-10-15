# Nihed Zaoui's portfolio (English version)

- `index.html`: the website
- `api/chat.js`: chatbot serverless function (Groq, free)

## Deploy on Vercel
1. Create a repository on github.com and upload the content of this folder.
2. On vercel.com: Add New > Project > pick the repository.
3. Before deploying, under Environment Variables add:
   - Name: GROQ_API_KEY
   - Value: your key from console.groq.com/keys
4. Click Deploy.

Optional: GROQ_MODEL to change the model (default llama-3.3-70b-versatile).
