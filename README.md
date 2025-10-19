# Taskboard: Project & Task Management System (MERN + Gemini AI)

> A full-stack Kanban board with AI-powered project and task insights. Built with MongoDB, Express, React, Node.js, and Gemini AI integration.

---

## Features

### Project Management

- Create, read, update, and delete projects
- Each project has name, description, created date
- View all projects and select to view board

### Task Management

- Create, read, update, delete tasks/cards within projects
- Each task has title, description, column/status
- Organize cards into columns (To Do, In Progress, Done, etc.)

### Kanban Board (Trello-like)

- Visual board per project
- Drag and drop cards between columns
- Switch between projects
- Cards display key info at a glance

### AI Features (Gemini Integration)

- **Summarize**: AI summarizes all tasks in a project
- **Ask AI**: Ask questions about specific cards and get AI-powered responses
- Gemini API integration with fallback for reliability

### Data Persistence

- MongoDB for all projects and tasks
- Proper relationships (tasks belong to projects/columns)
- Changes persist across sessions

### Non-Functional

- Responsive, user-friendly UI
- API-based architecture (RESTful)
- Clean, maintainable code
- Error boundaries, retry buttons, skeleton loaders
- Logging, monitoring, health check route, and secure CORS

---

## Project Structure

```
task-flow-ai/
	├── src/                # Backend (Express, MongoDB)
	├── client/             # Frontend (React, Vite)
	├── scripts/            # Automation/test scripts
	├── .env.example        # Example environment config
	└── README.md           # This file
```

---

## Backend Setup (Express + MongoDB)

### Prerequisites

- Node.js 18+
- MongoDB Atlas or local MongoDB

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/taskboard?retryWrites=true&w=majority
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### Install & Run

```sh
cd task-flow-ai
npm install
npm run dev
# or: npm start
```

Server runs on `http://localhost:4000` by default.

### Key Backend Endpoints

- `POST   /api/projects` – Create project
- `GET    /api/projects` – List projects
- `GET    /api/projects/:id` – Get project board (columns + tasks)
- `PUT    /api/projects/:id` – Update project
- `DELETE /api/projects/:id` – Delete project
- `POST   /api/projects/:id/summarize` – Summarize project (AI)
- `POST   /api/tasks` – Create task
- `PUT    /api/tasks/:id` – Update task
- `DELETE /api/tasks/:id` – Delete task
- `POST   /api/tasks/:id/ask` – Ask AI for task
- `PATCH  /api/tasks/:id/move` – Move task (drag-and-drop)
- `GET    /health` – Health check

---

## Frontend Setup (React + Vite)

### Prerequisites

- Node.js 18+

### Install & Run

```sh
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies API requests to backend.

---

## Gemini AI Integration

- Requires a valid `GEMINI_API_KEY` in backend `.env`.
- Used for project summarization and task Q&A.
- Falls back to deterministic local suggestions if API is unavailable.

---

## Testing & Automation

- Automated scripts in `/scripts` for end-to-end and AI feature tests.
- Example: `node scripts/testAllFeatures.js` (run with backend running)

---

## Deployment

- Deploy backend (Express) to Render, Railway, or similar
- Deploy frontend (React) to Vercel, Netlify, or similar
- Set environment variables in deployment dashboard

---
