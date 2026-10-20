# 🎯 AI Mock Interview Platform

An AI-powered interview preparation and coding practice platform that helps students, fresh graduates, job seekers, and working professionals prepare for interviews using resume-based questions, AI evaluation, adaptive follow-ups, and hands-on coding challenges.

---

## ✨ Features

### 🎤 Interview Practice
- **Technical Interviews** — Data structures, algorithms, system design, and domain-specific questions
- **Behavioral Interviews** — STAR-method questions with AI-powered feedback
- **HR Interviews** — Common HR and managerial round preparation
- **Resume-Based Interviews** — Questions generated from your uploaded resume 
- **Adaptive Follow-ups** — AI generates follow-up questions based on your previous answers
- **AI Evaluation** — Detailed scoring with strengths, weaknesses, and improvement suggestions

### 💻 Coding Practice
- Curated coding problems with difficulty levels (Easy, Medium, Hard)
- Built-in code editor with syntax highlighting
- Support for multiple programming languages (Python, JavaScript, Java, C++)
- Code execution via Judge0 integration
- Test case results and submission history

### 📊 Dashboard & Analytics
- Interview scores and performance trends
- Category-wise breakdowns with interactive charts
- Recent interview history and quick actions
- Strengths and improvement area tracking

### 👤 User Management
- Secure registration and login with session authentication
- Profile management with skills, education, and experience
- Resume upload and parsing (PDF & DOCX)
- Notification system

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, React Router 7, Recharts, Lucide Icons |
| **Backend** | Python, Django 6.1, Django REST Framework |
| **Database** | MySQL 8+ |
| **AI Engine** | Google Gemini API (`google-genai`) |
| **Code Execution** | Judge0 CE API |
| **Document Parsing** | PyMuPDF (PDF), python-docx (DOCX) |
| **HTTP Client** | Axios |

---

## 📁 Project Structure

```
ai-mock-interview-platform/
├── backend/                     # Django backend
│   ├── accounts/                # User auth, profiles, notifications
│   ├── interviews/              # Interview models, views, AI services
│   │   └── services/
│   │       ├── gemini_service.py        # Gemini API integration
│   │       ├── interview_service.py     # Interview workflow logic
│   │       └── question_bank_service.py # Question generation
│   ├── coding/                  # Coding problems, submissions, execution
│   │   └── services/
│   │       └── executor.py      # Code execution service
│   ├── backend_app/             # Django project settings & URLs
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Environment variables template
│
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── api/                 # Axios API client modules
│   │   ├── components/
│   │   │   ├── auth/            # Auth guards
│   │   │   ├── coding/          # Code editor, test results
│   │   │   ├── layout/          # Header, Sidebar, AppLayout
│   │   │   └── ui/              # Reusable UI components
│   │   ├── context/             # Auth & Theme context providers
│   │   └── pages/               # All page components
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Python** 3.10+ — [Download](https://www.python.org/downloads/)
- **Node.js** 18+ and **npm** — [Download](https://nodejs.org/)
- **MySQL** 8.0+ — [Download](https://dev.mysql.com/downloads/)
- **Git** — [Download](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/meettarapara08/ai-mock-interview-platform.git
cd ai-mock-interview-platform
```

### 2. Set Up MySQL Database

Open the MySQL shell and create the database:

```sql
CREATE DATABASE ai_mock_interview CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> If you use a custom database name, user, or password, update them in the `.env` file (Step 3).

### 3. Backend Setup

```bash
cd backend
```

#### a) Create and activate a virtual environment

**Windows:**
```bash
python -m venv .venv
.venv\Scripts\activate
```

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

#### b) Install Python dependencies

```bash
pip install -r requirements.txt
```

#### c) Configure environment variables

Copy the example env file and edit it with your credentials:

```bash
cp .env.example .env
```

Edit `backend/.env` and fill in your values:

```env
SECRET_KEY=your-secure-random-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# MySQL Database
DB_NAME=ai_mock_interview
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_HOST=127.0.0.1
DB_PORT=3306

# Frontend Origin (must match Vite dev server)
CORS_ORIGIN=http://localhost:5173

# Google Gemini API Key (get one at https://aistudio.google.com/apikey)
GEMINI_API_KEY=your-gemini-api-key

# Code Execution (optional)
CODE_EXECUTION_PROVIDER=judge0
JUDGE0_API_URL=https://ce.judge0.com/submissions
```

> ⚠️ **Important:** Never commit your `.env` file. It is already listed in `.gitignore`.

#### d) Run database migrations

```bash
python manage.py migrate
```

#### e) Create a superuser (admin access)

```bash
python manage.py createsuperuser
```

#### f) (Optional) Seed coding problems

```bash
python manage.py seed_coding_problems
```

#### g) Start the backend server

```bash
python manage.py runserver
```

The backend API will be running at **http://127.0.0.1:8000**

### 4. Frontend Setup

Open a **new terminal** and navigate to the frontend:

```bash
cd frontend
```

#### a) Install Node dependencies

```bash
npm install
```

#### b) Start the dev server

```bash
npm run dev
```

The frontend will be running at **http://localhost:5173**

---

## 🔗 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register/` | User registration |
| `POST /api/auth/login/` | User login |
| `POST /api/auth/logout/` | User logout |
| `GET /api/auth/user/` | Get current authenticated user |
| `GET /api/profile/` | Get user profile |
| `PUT /api/profile/` | Update user profile |
| `POST /api/interviews/start/` | Start a new interview session |
| `POST /api/interviews/<id>/answer/` | Submit an answer |
| `GET /api/interviews/<id>/result/` | Get interview results |
| `GET /api/interviews/history/` | Get interview history |
| `GET /api/coding/problems/` | List coding problems |
| `GET /api/coding/problems/<slug>/` | Get problem details |
| `POST /api/coding/submit/` | Submit code solution |
| `GET /api/notifications/` | Get user notifications |

> Visit **http://127.0.0.1:8000/admin/** for the Django admin panel.

---

## 🔑 Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key and paste it into your `backend/.env` file as `GEMINI_API_KEY`

---

## 🧪 Running Checks

### Backend

```bash
cd backend
python manage.py check          # Django system check
python manage.py test            # Run test suite
python manage.py makemigrations --check  # Verify no pending migrations
```

### Frontend

```bash
cd frontend
npm run lint       # Run linter
npm run build      # Verify production build
```

---

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | ✅ | Django secret key for cryptographic signing |
| `DEBUG` | ❌ | Set to `True` for development (default: `True`) |
| `ALLOWED_HOSTS` | ❌ | Comma-separated allowed hostnames |
| `DB_NAME` | ✅ | MySQL database name |
| `DB_USER` | ✅ | MySQL username |
| `DB_PASSWORD` | ✅ | MySQL password |
| `DB_HOST` | ❌ | MySQL host (default: `127.0.0.1`) |
| `DB_PORT` | ❌ | MySQL port (default: `3306`) |
| `CORS_ORIGIN` | ❌ | Frontend origin URL |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key for AI features |
| `CODE_EXECUTION_PROVIDER` | ❌ | Code execution provider (`judge0`) |
| `JUDGE0_API_URL` | ❌ | Judge0 API endpoint URL |

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Commit** your changes: `git commit -m "feat: add your feature"`
4. **Push** to your branch: `git push origin feature/your-feature-name`
5. **Open** a Pull Request

### Guidelines

- Follow existing code patterns and project structure
- Keep frontend and backend changes in logical, separate commits
- Do not commit `.env` files or API keys
- Test your changes before submitting a PR

---

## 📄 License

This project is for educational and personal use.

---

## 🙋 Support

If you run into issues during setup, please [open an issue](https://github.com/meettarapara08/ai-mock-interview-platform/issues) on GitHub.
