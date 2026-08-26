# 🪞 MirrorMind

> **Your Thinking. Your Twin.**  
> An AI-powered decision intelligence mirror that helps you reflect, reason, and grow.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-mirror--mind--app.vercel.app-black?style=for-the-badge&logo=vercel)](https://mirror-mind-app.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the App](#running-the-app)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Code of Conduct](#-code-of-conduct)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## 🧠 About

**MirrorMind** is an AI-powered journaling and decision-intelligence platform that acts as your cognitive twin. It helps you:

- Reflect deeply on your thoughts and decisions
- Identify patterns in your thinking over time
- Get AI-generated insights and second opinions
- Build a personal knowledge base from your own reflections

Think of it as a journal that thinks back — your ideas, mirrored and amplified by AI.

---

## ✨ Features

- 🔐 **Secure Authentication** — Email/password sign-up and login via NextAuth.js
- 🤖 **AI-Powered Reflection** — Claude-based AI responds to your journal entries with thoughtful insights
- 📓 **Smart Journaling** — Rich journaling interface with history and search
- 🧩 **Decision Intelligence** — AI helps you reason through complex decisions
- 🌗 **Light / Dark Mode** — Comfortable for any time of day
- 📱 **Fully Responsive** — Works seamlessly on mobile and desktop
- 🔒 **Private by Default** — Your data is yours; stored securely via Prisma + PostgreSQL

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Auth | [NextAuth.js](https://next-auth.js.org/) |
| Database ORM | [Prisma](https://www.prisma.io/) |
| Database | PostgreSQL (via Supabase / Neon) |
| AI | Claude (`claude-sonnet-4-6`) via [freemodel.dev](https://api.freemodel.dev) |
| Styling | Tailwind CSS |
| Deployment | [Vercel](https://vercel.com/) |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) `>= 18.x`
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A PostgreSQL database (e.g. [Supabase](https://supabase.com/), [Neon](https://neon.tech/), or local)
- An AI API key from [freemodel.dev](https://api.freemodel.dev) (or any OpenAI-compatible endpoint)

---

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/SwapnilMk/mirror-mind.git
cd mirror-mind

# 2. Install dependencies
npm install
# or
pnpm install
```

---

### Environment Variables

Create a `.env` file in the root of the project and fill in the values:

```dotenv
# ─── Database ────────────────────────────────────────────────
# Connection URL used by Prisma (with connection pooling, e.g. PgBouncer on Supabase)
DATABASE_URL=""

# Direct connection URL (used for Prisma migrations — bypasses pooler)
DIRECT_URL=""

# ─── Auth ────────────────────────────────────────────────────
# A random secret string used to sign/encrypt NextAuth session tokens
# Generate one with: openssl rand -base64 32
NEXTAUTH_SECRET=""

# The base URL of your app (change for production)
NEXTAUTH_URL="http://localhost:3000"

# ─── AI ──────────────────────────────────────────────────────
# Your API key from platform.claude.com
AI_API_KEY=""

# The model to use for AI inference
AI_MODEL="claude-3-5-sonnet-20241022"
```

> **Tip:** Never commit your `.env` file to version control. The `.gitignore` already excludes it.

---

### Database Setup

Run the Prisma migration to set up your database schema:

```bash
# Push schema to your database (for development)
npx prisma db push

# Or run migrations (for production-style workflow)
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to inspect your data
npx prisma studio
```

---

### Running the App

```bash
# Start the development server
npm run dev

# Open in your browser
# http://localhost:3000
```

```bash
# Build for production
npm run build

# Start the production server
npm start
```

---

## 📁 Project Structure

```
mirror-mind/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth routes: login, register
│   ├── (dashboard)/        # Protected dashboard routes
│   ├── api/                # API route handlers
│   │   ├── auth/           # NextAuth endpoints
│   │   └── ai/             # AI chat/reflection endpoints
│   └── layout.tsx          # Root layout
│
├── components/             # Reusable UI components
│   ├── ui/                 # Base UI primitives
│   └── ...
│
├── lib/                    # Utilities and helpers
│   ├── auth.ts             # NextAuth config
│   ├── prisma.ts           # Prisma client singleton
│   └── ai.ts               # AI client config
│
├── prisma/
│   └── schema.prisma       # Database schema
│
├── public/                 # Static assets
├── .env                    # Environment variables (local, not committed)
├── next.config.ts          # Next.js config
├── tailwind.config.ts      # Tailwind CSS config
└── package.json
```

---

## 📡 API Reference

### `POST /api/ai/reflect`

Send a journal entry or question to the AI and receive a thoughtful reflection.

**Request Body:**
```json
{
  "message": "I'm struggling to decide whether to switch careers.",
  "history": []
}
```

**Response:**
```json
{
  "reply": "That's a significant crossroads. Let's break down what's pulling you in each direction..."
}
```

---

## ☁️ Deployment

The easiest way to deploy MirrorMind is via [Vercel](https://vercel.com/):

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add all environment variables from your `.env` under **Project Settings → Environment Variables**
4. Deploy!

For the database, set `DATABASE_URL` to a pooled connection string and `DIRECT_URL` to the direct (non-pooled) connection string — required for Prisma to run migrations correctly on Vercel.

---

## 🤝 Contributing

Contributions are welcome and appreciated! Here's how to get involved:

### 1. Fork & Clone

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/mirror-mind.git
cd mirror-mind
```

### 2. Create a Branch

Use a descriptive branch name:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch naming conventions:**

| Prefix | Use for |
|--------|---------|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation changes |
| `refactor/` | Code refactoring |
| `chore/` | Tooling, deps, config |

### 3. Set Up the Dev Environment

```bash
npm install
cp .env.example .env   # Fill in your own credentials
npx prisma db push
npm run dev
```

### 4. Make Your Changes

- Write clean, typed TypeScript
- Follow the existing code style (ESLint + Prettier are set up)
- Add or update tests if applicable
- Update documentation if your change affects usage

### 5. Lint & Format

```bash
npm run lint
npm run format
```

### 6. Commit Your Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add reflection history export"
```

**Commit message format:**

```
<type>(optional scope): <short description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 7. Push & Open a Pull Request

```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub targeting the `main` branch.

**In your PR, please include:**
- A clear description of what you changed and why
- Screenshots or screen recordings for UI changes
- Steps to test your changes
- Any related issues (e.g. `Closes #42`)

### 8. Code Review

A maintainer will review your PR. You may be asked to make changes — that's totally normal. Once approved, your PR will be merged. 🎉

---

### 💡 Good First Issues

Look for issues tagged [`good first issue`](https://github.com/SwapnilMk/mirror-mind/issues?q=is%3Aissue+label%3A%22good+first+issue%22) on the GitHub repo — these are great starting points if you're new to the project.

---

### 🐛 Reporting Bugs

Found a bug? Please [open an issue](https://github.com/SwapnilMk/mirror-mind/issues/new) with:

- Steps to reproduce
- Expected vs actual behavior
- Browser/OS/Node version
- Screenshots if relevant

---

### 💬 Feature Requests

Have an idea? [Open a feature request](https://github.com/SwapnilMk/mirror-mind/issues/new) and describe:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

---

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you agree to uphold a welcoming, respectful environment for everyone.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Anthropic](https://anthropic.com/) for Claude AI
- [freemodel.dev](https://api.freemodel.dev) for the AI API gateway
- [Vercel](https://vercel.com/) for seamless deployment
- [Prisma](https://www.prisma.io/) for the incredible ORM
- [NextAuth.js](https://next-auth.js.org/) for authentication
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/SwapnilMk">Swapnil Mk</a>
</div>
