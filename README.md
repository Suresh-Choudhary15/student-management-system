# Student Group & Assignment Management System

A full-stack web application for managing student groups, assignments, and submissions with role-based access control.

## 🚀 Tech Stack

- **Frontend:** React.js + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT
- **Deployment:** Docker + Docker Compose

## ✨ Features

### Student Features

- Register and login with JWT authentication
- Create and manage groups
- Add members to groups via email
- View assignments with OneDrive links
- Two-step submission verification
- Track progress with visual indicators

### Admin/Professor Features

- Create, edit, and delete assignments
- Track group-wise submissions
- Monitor student progress
- View analytics dashboard
- Real-time submission statistics

## 🏃 Quick Start

### Prerequisites

- Docker Desktop
- Git

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/Suresh-Choudhary15/student-management-system.git
   cd student-management-system
   \`\`\`

2. Start with Docker:
   \`\`\`bash
   docker-compose up --build
   \`\`\`

3. Access the application:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📊 Database Schema

- **users** - Student and admin accounts
- **groups** - Student groups
- **group_members** - Group membership (many-to-many)
- **assignments** - Assignments created by professors
- **submissions** - Two-step submission tracking

## 🔐 Authentication

- JWT-based authentication
- Role-based access control (Student/Admin)
- Password hashing with bcrypt

## 📝 API Endpoints

See full API documentation in the repository documentation files.

## 🎓 Project Context

Built as part of Joineazy Full Stack Internship Task 2. The system enables collaborative learning where students form groups, complete assignments, and track their progress, while professors monitor submissions and analyze performance.

## 📄 License

MIT License

## 👤 Author

Suresh Choudhary
