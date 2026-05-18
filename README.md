# Placement Preparation Portal

A React and Python FastAPI mini project for campus placement preparation.

## Features

- Student login/register demo flow
- Aptitude test module with timer and instant score
- Coding practice module for Python, Java, and C starters
- Interview preparation questions
- Resume builder with live preview
- Progress tracker
- Admin dashboard, question management, user list, and reports
- AI integration suggestions for mock interviews, resume analysis, code review, adaptive testing, and weak-area prediction

## Tech Stack

- Frontend: React + Vite
- Backend: Python FastAPI
- Authentication: JWT-ready backend skeleton

## Run Frontend

```powershell
npm.cmd install
npm.cmd run dev -- --port 5173
```

Open `http://127.0.0.1:5173`.

## Run Backend

Install Python first if it is not available on your machine.

```powershell
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## API Keys

Copy `backend/.env.example` to `backend/.env`, then add keys there:

```env
JWT_SECRET_KEY=your-long-secret
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5-mini
```

Keep API keys in the backend only. Do not add them to React files.

Frontend defaults to `http://127.0.0.1:8000`. To use another backend URL, set:

```env
VITE_API_BASE=https://your-backend-url
```
