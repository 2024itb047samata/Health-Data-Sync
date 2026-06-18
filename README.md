# 🏥 PulseOS – AI-Powered Hospital Command Center

PulseOS is an intelligent hospital operations platform designed to streamline OPD workflows, patient queue management, doctor allocation, and real-time hospital monitoring.

Built for modern healthcare systems, PulseOS combines AI-driven insights, live patient tracking, and hospital command-center visualization into a single platform.

---

## 🚀 Live Demo

Frontend:
https://health-data-sync.vercel.app/pulseos-landing.html

Backend API:
https://pulseos-api.onrender.com

---

## ✨ Features

### 👨‍⚕️ Doctor Management
- Real-time doctor availability tracking
- Department-wise doctor allocation
- Consultation status monitoring
- Staff performance metrics

### 🧑‍🤝‍🧑 Smart Queue Management
- Token-based patient queue
- Department-wise segregation
- Priority & emergency handling
- Estimated waiting time prediction

### 🏥 Hospital Command Center
- Live hospital statistics
- Emergency monitoring
- AI-generated operational insights
- Department load visualization

### 🤖 AI-Powered Healthcare Workflow
- Patient registration
- Medical record linking
- AI health analysis
- Doctor assignment
- Treatment completion tracking

### 📊 Analytics Dashboard
- Queue velocity monitoring
- Average waiting time
- System efficiency score
- AI Health Score

### 🌐 ABHA Ready
- Designed for India's Digital Health Ecosystem
- ABHA integration support
- Digital patient record workflow

---

## 🛠 Tech Stack

### Frontend
- React
- TypeScript
- TailwindCSS
- Vite
- Wouter
- React Query

### Backend
- Node.js
- Express.js
- TypeScript

### Database
- PostgreSQL
- Drizzle ORM

### Deployment
- Vercel (Frontend)
- Render (Backend + PostgreSQL)
---

## ⚙️ Environment Variables

### Frontend (.env)

```env
VITE_API_URL=https://pulseos-api.onrender.com
```

### Backend (.env)

```env
DATABASE_URL=your_postgresql_connection_string
PORT=3000
```

---

## 🔧 Local Setup

### Clone Repository

```bash
git clone https://github.com/2024itb047samata/Health-Data-Sync.git
cd Health-Data-Sync
```

### Install Dependencies

```bash
npm install
```

### Start Backend

```bash
cd artifacts/api-server
npm install
npm run dev
```

### Start Frontend

```bash
cd artifacts/hospital-command
npm install
npm run dev
```

---

## 🗄 Database Setup

Generate migrations:

```bash
npx drizzle-kit generate
```

Push schema:

```bash
npx drizzle-kit push
```

---

## 📈 Future Enhancements

- AI symptom triage
- Voice-based patient registration
- Multilingual support
- Appointment scheduling
- Medical report summarization
- Doctor recommendation engine
- Predictive crowd management
- Mobile companion app

---

## 🎯 Problem Solved

Hospitals often struggle with:

- Long waiting queues
- Poor visibility into patient flow
- Doctor workload imbalance
- Lack of operational analytics
- Emergency handling inefficiencies

PulseOS provides a centralized AI-assisted command center to improve patient experience and hospital efficiency.
-------------------------------------------BY SAMMY------------------------------------------------------------------

---

## 📜 License

MIT License

---

## ❤️ Built for Better Healthcare

*"Smarter Hospitals. Faster Care. Better Outcomes."*
