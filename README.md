# DMS AJ&K — Domicile Management System

A production-ready full-stack MERN application for managing domicile certificates in AJ&K.

## Project Structure

```
domicile-project/
├── client/        → React 19 + Vite + TypeScript + Tailwind CSS
└── server/        → Node.js + Express + MongoDB + JWT
```

## Quick Start

### 1. Setup Backend (server)

```bash
cd server
npm install
```

Edit `.env` if needed (MongoDB URI and Cloudinary credentials are pre-configured).

```bash
npm run dev
```

Backend runs on **http://localhost:5000**

### 2. Setup Frontend (client)

```bash
cd client
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## Demo Accounts

After starting the server, create accounts via the Register page or use the seed script:

```bash
cd server
npm run seed
```

This creates:
| Role    | Email                    | Password     |
|---------|--------------------------|--------------|
| Admin   | admin@dms.gov.pk         | Admin@123    |
| Clerk   | clerk@dms.gov.pk         | Clerk@123    |
| Citizen | citizen@dms.gov.pk       | Citizen@123  |

---

## Features

### Citizen
- Register / Login
- Apply for domicile certificate (multi-step form)
- Upload documents (CNIC, photos, etc.)
- Track application status
- Download certificate when approved
- Notifications

### Admin
- Dashboard with analytics & charts
- Review and approve/reject applications
- Manage users and clerks
- Document wallet per citizen
- Status tracker & audit logs
- Settings & privacy policy

### Clerk
- View assigned applications
- Review and update status
- Document wallet access
- Notifications

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PATCH  /api/auth/me

GET    /api/applications
POST   /api/applications
GET    /api/applications/:id
PATCH  /api/applications/:id/status
GET    /api/applications/:id/certificate
GET    /api/applications/verify/:certificateNumber

GET    /api/admin/dashboard-stats
GET    /api/admin/applications
POST   /api/admin/application/:id/approve
POST   /api/admin/application/:id/reject
GET    /api/admin/users
GET    /api/admin/status-tracker
GET    /api/admin/document-wallet/:citizenId

GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/mark-all-read
```

---

## Tech Stack

**Frontend:** React 19, Vite, TypeScript, Tailwind CSS 4, Radix UI, React Hook Form, Zod, Wouter, Recharts, Framer Motion, Sonner

**Backend:** Node.js, Express 4, MongoDB Atlas, Mongoose, JWT, bcrypt, Multer, Cloudinary, PDFKit, Morgan

---

## Environment Variables

### server/.env
```
PORT=5000
NODE_ENV=development
MONGO_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<your-secret-key>
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
CLIENT_URL=http://localhost:5173
```

### client/.env
```
VITE_API_URL=http://localhost:5000/api
```
