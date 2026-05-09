# ARIA — Adaptive Rule-based Intelligent Assistant

## Setup & Run

1. Install dependencies:
   ```bash
   cd aria-chatbot
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```
   (or: `npm run dev` for auto-reload with nodemon)

3. Open in browser:
   http://localhost:3000

## Features
- 29 rule-based response categories
- Session memory (remembers your name)
- Mood system (7 moods)
- Live time and date
- Coin flip and dice roll
- Math calculator
- Jokes, fun facts, motivational quotes
- Animated particle background
- Chat export (.txt)
- Mobile responsive

## Tech Stack
- Backend: Node.js + Express
- Frontend: HTML5 + CSS3 + Vanilla JavaScript
- No database — all data in JS arrays

## Free Deployment
This app is ready for free deployment on platforms like Render or Railway.

### Steps to deploy on Render
1. Initialize git locally:
   ```bash
   cd aria-chatbot
   git init
   git add .
   git commit -m "Initial ARIA chatbot deploy"
   ```
2. Create a GitHub repository and push your project.
3. Go to https://render.com and sign up.
4. Create a new Web Service, connect your GitHub repo, and choose branch `main`.
5. Use these settings:
   - Build command: `npm install`
   - Start command: `npm start`
6. Deploy and open the generated site URL.

### Steps to deploy on Railway
1. Push your repo to GitHub.
2. Sign up at https://railway.app.
3. Create a new project from GitHub and import the repository.
4. Railway will detect `npm start` and deploy automatically.

### Notes
- `Procfile` and `render.yaml` are included so Render can detect the app.
- The server now uses `process.env.PORT || 3000` for compatibility with cloud hosts.
- A `screenshots/` folder is included so you can add website output images to the repo.
- I cannot directly publish to GitHub from this environment because it does not have GitHub CLI installed and I do not have authenticated access to your GitHub account.

## Push to GitHub
Once you create the repo on GitHub, run these commands:
```bash
cd aria-chatbot
git remote add origin https://github.com/Saikaushik007/aria-chatbot.git
git branch -M main
git push -u origin main
```
