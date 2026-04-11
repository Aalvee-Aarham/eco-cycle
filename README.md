# ♻️ EcoCycle — Smart Waste Management & Social Community

EcoCycle is a production-oriented **MERN** stack platform designed for a waste classification and community reward system. Users upload images of waste, which are classified by **Gemini AI** into categories like recyclable, organic, e-waste, or hazardous. The platform features an automated reward system, social interactions, and a robust administrative audit trail.

---

## 🚀 Live Demo
**URL**: [https://ecoCycle.aalvee.hackathon.vercel.app](https://ecoCycle.aalvee.hackathon.vercel.app)

---

## ✨ Key Features

- **AI Waste Classification**: Powered by **Google Gemini 2.0 Flash**, identifying waste categories from image uploads in real-time.
- **Gamified Rewards**: Earn points for successful classifications and complete daily streaks to level up.
- **Social Feed**: Follow other "Eco-Warriors," see their recent activity, and track the community's impact.
- **Leaderboards**: Competitive ranking based on total points and accuracy.
- **Moderation System**: Dispute resolution workflow for low-confidence AI results.
- **Advanced Privacy**: Toggle profile privacy to hide your detailed stats from the public feed.
- **Full Audit Trail**: Every action (login, classification, follow, reward) is cryptographically recorded for administrative review.
- **Resilient Architecture**: Designed to degrade gracefully (Redis caching and fraud detection are optional).

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Zustand (State Management), TanStack Query.
- **Backend**: Node.js, Express, Socket.io (Real-time updates).
- **Database**: MongoDB (Mongoose), Redis (Caching/Rate-limiting).
- **AI**: Google Generative AI (Gemini Flash).
- **Security**: JWT Authentication, RBAC (Citizen/Moderator/Admin), BCrypt hashing.

---

## 📦 Repository Layout

| Path       | Description                                      |
|------------|--------------------------------------------------|
| `server/`  | Express API, MongoDB models, AI adapters, and services |
| `client/`  | React frontend with Tailwind and real-time sockets |

---

## ⚙️ Local Setup

### 1. Prerequisites
- **Node.js 18+**
- **MongoDB Atlas** connection string.
- **Google AI Studio API Key** ([Get one here](https://aistudio.google.com/apikey)).
- **Redis** (Optional: for leaderboard speed and fraud detection).

### 2. Initialization
From the repository root:

```bash
# Install dependencies for both client and server
npm install

# Setup environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 3. Configure Environment
Edit `server/.env`:
- `MONGO_URI`: Your MongoDB connection string.
- `GEMINI_API_KEY`: Your Google AI key.
- `PORT`: Set to `5001`.

### 4. Seed the Database
Populate your database with **massive demo data** (15 submissions per user, 60+ total):
```bash
npm run seed
```

### 5. Start Development
```bash
npm run dev
```
- **Client**: `http://localhost:5172` (or your local Vite port)
- **Server**: `http://localhost:5001`

---

## 👤 Demo Accounts

The database comes pre-seeded with these accounts for testing. They use the `@demo.ecocycle.app` domain.

| Role            | Email                         | Password          | Capabilities |
|-----------------|-------------------------------|-------------------|--------------|
| **Citizen**     | `citizen@demo.ecocycle.app`   | `DemoCitizen1!`   | Upload, Follow, Feed |
| **Moderator**   | `moderator@demo.ecocycle.app` | `DemoModerator1!` | Dispute Queue, Audits |
| **Administrator** | `admin@demo.ecocycle.app`     | `DemoAdmin1!`     | Full System Control |
| **Private Demo**| `neighbor@demo.ecocycle.app`  | `DemoNeighbor1!`  | Test account with `isPrivate: true` |

---

## 🛡️ Security Note
Never commit your `.env` file. EcoCycle uses `.env.example` as a template. If your Gemini API or Mongo credentials are ever exposed, rotate them immediately in their respective dashboards.

## 📄 License
Project developed for the AUST CSE Carnival. All rights reserved.
