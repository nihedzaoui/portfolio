Nihed Zaoui's portfolio (English version)
`index.html`: the website
`api/chat.js`: chatbot serverless function (Groq, free)
Deploy on Vercel
Create a repository on github.com and upload the content of this folder.
On vercel.com: Add New > Project > pick the repository.
Before deploying, under Environment Variables add:
Name: GROQ_API_KEY
Value: your key from console.groq.com/keys
Click Deploy.
Optional: GROQ_MODEL to change the model (default llama-3.3-70b-versatile).
