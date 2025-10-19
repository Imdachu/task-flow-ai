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

## Tech Stack

- **Frontend:** React.js (Vite), DnD Kit, Axios, modern CSS
- **Backend:** Node.js, Express.js, Joi, CORS, dotenv
- **Database:** MongoDB (Atlas or local), Mongoose
- **AI Integration:** Gemini AI (Google Generative Language API)
- **Testing/Automation:** Jest, Supertest, custom scripts
- **Deployment:** Vercel/Netlify (frontend), Render/Railway (backend)

---

## How it works / Demo

### 1. Project & Task Management

- **Create Projects:** Click "+ New Project", enter a name and description. Projects appear on the dashboard.
- **Edit/Delete Projects:** Use the "Edit" or "Delete" buttons on each project card to update or remove projects.

### 2. Kanban Board

- **View Board:** Click a project to open its Kanban board.
- **Add Tasks:** Click "+ Add Task" in any column to create a new task with title and description.
- **Edit/Delete Tasks:** Click "Edit" or "Delete" on any task card to update or remove it.
- **Drag & Drop:** Move tasks between columns (To Do, In Progress, Done) by dragging and dropping.

### 3. AI Features (Gemini Integration)

- **Summarize Project:** Click "Summarize Project" to get an AI-generated summary of all tasks in the project.
- **Ask AI About a Task:** Click "Ask AI" on any task card to get instant AI-powered suggestions or clarifications for that task.

### 4. Reliability & UX

- **Persistence:** All data is saved in MongoDB and persists across sessions.
- **Error Handling:** The app uses error boundaries and retry buttons for a smooth experience.
- **Loading States:** Skeleton loaders and spinners indicate loading and processing.
- **Health Check:** Visit `/health` on the backend to verify server and database status.

### 5. Demo Videos

- [Demo Video 1 (Loom)](https://www.loom.com/share/b500f1a07cbc4bd0932fcf01bbed2970?sid=ea485063-18d0-4b04-8ce7-29ffee129be4)
- [Demo Video 2 (Loom)](https://www.loom.com/share/a683fb4337794a4787fd24efa6292a80?sid=07e4cd61-efb1-4b11-8b91-457a20870964)

---![alt text](<Untitled diagram-2025-10-19-193211.png>)
