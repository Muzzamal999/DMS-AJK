# DMS AJ&K — Domicile Management System

Azad Jammu & Kashmir Government's official digital platform for managing and issuing Domicile Certificates to citizens.

---

## Overview

DMS AJ&K is a comprehensive web-based application that streamlines the process of domicile certificate issuance. The system facilitates interaction between three main user roles: **Citizens**, **Clerks**, and **Administrators**.

---

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Radix UI components
- **Forms**: React Hook Form + Zod validation
- **Routing**: Wouter (lightweight router)
- **State**: React Context API

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (MongoDB Atlas)
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **PDF Generation**: PDFKit

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account (for file uploads)

### Environment Setup

**Server (.env)**
```env
PORT=5000
MONGODB_URI=mongodb+srv://your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Client (.env)**
```env
VITE_API_URL=http://localhost:5000/api
```

### Installation & Running

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Run server (terminal 1)
cd server && npm run dev

# Run client (terminal 2)
cd client && npm run dev
```

The client will be available at `http://localhost:5173` and the API at `http://localhost:5000`.

---

## User Roles & Permissions

### 🔹 Citizen
- Register and apply for domicile certificates
- Upload required documents
- Track application status in real-time
- Download approved certificates
- Receive notifications on status updates

### 🔹 Government Clerk
- View all submitted applications
- Verify documents and citizen information
- Update application status (Under Review, Verified, Rejected)
- Forward verified applications to Admin
- Manage document wallet
- Track application processing history

### 🔹 Administrator
- Final approval of verified applications
- Generate certificate numbers
- Access analytics and statistics
- Manage system-wide settings
- Handle support requests

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Citizen | citizen@ajk.gov.pk | pass123 |
| Clerk | clerk@ajk.gov.pk | pass123 |
| Admin | admin@ajk.gov.pk | pass123 |

---

## Application Status Workflow

```
Citizen submits application
         ↓
┌─────────────────┐
│  Status: PENDING│ ← Clerk sees in queue
└────────┬────────┘
         ↓
┌─────────────────┐
│  Status:        │
│  IN_REVIEW      │ ← Clerk is verifying
└────────┬────────┘
         ↓
┌��────────────────┐
│  Status:        │
│  VERIFIED       │ ← Documents verified
└────────┬────────┘
         ↓
┌─────────────────┐
│  Status:        │
│  FORWARDED_TO   │ ← Sent to Admin
│  _ADMIN         │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Status: APPROVED│ ← Certificate generated
│  + Certificate# │
└─────────────────┘
```

### Status Definitions

| Status | Description |
|--------|-------------|
| `pending` | Application submitted, awaiting clerk review |
| `in_review` | Clerk is actively reviewing the application |
| `verified` | Documents verified, awaiting admin approval |
| `forwarded_to_admin` | Sent to admin for final approval |
| `approved` | Certificate issued with unique number |
| `rejected` | Application rejected with reason |

---

## API Routes

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | User login |
| GET | `/me` | Get current user profile |
| PATCH | `/me` | Update profile details |
| PATCH | `/change-password` | Change password |

### Applications (`/api/applications`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create new application |
| PUT | `/draft` | Save draft application |
| GET | `/` | List applications (role-filtered) |
| GET | `/stats` | Get public statistics |
| GET | `/:id` | Get single application |
| PATCH | `/:id/status` | Update application status |
| PATCH | `/:id/documents` | Upload documents |
| GET | `/:id/certificate` | Download certificate PDF |
| GET | `/verify/:certNum` | Public certificate verification |

### Notifications (`/api/notifications`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user notifications |
| PATCH | `/:id/read` | Mark notification as read |
| PATCH | `/read-all` | Mark all as read |

### Admin (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | System statistics |
| GET | `/users` | List all users |
| GET | `/activity` | Activity logs |

---

## Required Documents

Citizens must upload the following during application:

1. **CNIC Front** - Front side of National Identity Card
2. **CNIC Back** - Back side of National Identity Card
3. **Photograph** - Passport size photograph
4. **Residence Proof** - Proof of residence in AJK

---

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Protected API routes
- Audit logging
- 30-day password change restriction

---

## Pages Overview

### Citizen Pages
- `/citizen/dashboard` - Application overview & stats
- `/citizen/applications` - List of submitted applications
- `/citizen/documents` - Personal document wallet
- `/citizen/track/:id` - Track specific application
- `/citizen/notifications` - Notification center
- `/citizen/profile` - Profile settings

### Clerk Pages
- `/clerk/applications` - Application queue with filtering
- `/clerk/document-wallet` - All documents overview
- `/clerk/status-tracker` - Track citizen status checks
- `/clerk/notifications` - Internal notifications
- `/clerk/settings` - Clerk settings
- `/clerk/support` - Support resources

### Admin Pages
- `/admin/dashboard` - Analytics & system health
- `/admin/applications` - All applications management
- `/admin/users` - User management
- `/admin/document-wallet` - Full document access
- `/admin/notifications` - System notifications
- `/admin/activity` - Audit logs
- `/admin/settings` - System configuration

---

## Project Structure

```
final/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── apply/         # Application form components
│   │   │   ├── layout/        # Layout components
│   │   │   ├── shared/        # Shared components
│   │   │   └── ui/            # Radix UI components
│   │   ├── constants/         # App constants
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities & API wrapper
│   │   ├── pages/             # Page components
│   │   ├── providers/         # React context providers
│   │   ├── routes/            # Route definitions
│   │   ├── types/             # TypeScript types
│   │   └── App.tsx            # Root component
│   └── package.json
│
└── server/                    # Express backend
    └── src/
        ├── config/            # Configuration
        ├── controllers/       # Route controllers
        ├── middlewares/       # Express middlewares
        ├── models/            # Mongoose models
        ├── routes/            # API routes
        ├── utils/             # Utilities
        └── server.js          # Entry point
```

---

## Features Implemented

### Core Features
- [x] User registration and authentication
- [x] Multi-role login (Citizen/Clerk/Admin)
- [x] Online application submission
- [x] Document upload and storage
- [x] Real-time status tracking
- [x] Certificate generation and download
- [x] Certificate verification (public)
- [x] Password change system
- [x] Toast notifications
- [x] Responsive mobile design

### Clerk Features
- [x] Application queue management
- [x] Status update workflow
- [x] Document verification
- [x] Forward to admin functionality
- [x] Document wallet access
- [x] Status tracking logs

### Admin Features
- [x] System analytics dashboard
- [x] User activity monitoring
- [x] Application approval workflow
- [x] Audit logging
- [x] Support clerk management

---

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

### MongoDB Connection Issues
- Ensure your IP is whitelisted in MongoDB Atlas
- Check connection string format
- Verify network connectivity

### Cloudinary Upload Failures
- Check API credentials
- Ensure bucket permissions allow uploads
- Verify file size limits

---

## License

MIT License - Government of Azad Jammu & Kashmir

Built for the Government of Azad Jammu & Kashmir