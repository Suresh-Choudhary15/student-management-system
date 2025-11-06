# Student Group & Assignment Management System v2

A full-stack web application for managing student groups, assignments, and submissions with enhanced UI/UX and role-based access control.

## 🚀 Live Demo

- **Frontend**: [Vercel Link - Add after deployment]
- **Backend API**: [Render Link - Add after deployment]
- **Database**: MongoDB Atlas Cloud

## ✨ Enhanced Features (Round 2)

### 🎨 UI/UX Enhancements

- **Smooth Authentication Flow**: Beautiful login/registration with form validation and animations
- **Responsive Dashboards**: Tailwind CSS with mobile-first design and Framer Motion
- **Interactive Course Cards**: Clickable cards with hover animations and progress indicators
- **Progress Visualization**: Progress bars, status badges, and real-time analytics
- **Professor Analytics**: Comprehensive dashboard with submission tracking and student progress

### 🗄️ Database Enhancements (MongoDB Atlas)

- **Cloud Database**: MongoDB Atlas with secure connection
- **Structured Collections**: Users, Courses, Assignments, Groups, Submissions
- **Proper Relationships**: References between students, courses, and assignments
- **Group Management**: Complete group creation and member management with leader privileges

### 🔧 Backend Logic

- **JWT Authentication**: Secure role-based access control with middleware
- **Assignment Management**: Create, edit, and track individual/group assignments
- **Submission Workflow**: Two-step acknowledgment system with OneDrive integration
- **Analytics API**: Comprehensive progress tracking for students and professors

## 🚀 Tech Stack

### Frontend

- **React.js** with Hooks and Context API
- **Tailwind CSS** for responsive design
- **Framer Motion** for smooth animations
- **Axios** for API communication

### Backend

- **Node.js** with Express.js
- **MongoDB Atlas** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests

### Deployment & Database

- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas (Cloud)
- **Containerization**: Docker

## ✨ Features

### Student Features

✅ View enrolled courses with progress tracking

✅ Join/create groups for collaborative assignments

✅ Submit assignments with two-step acknowledgment

✅ Track personal progress across all courses

✅ View submission status and feedback

### Admin/Professor Features

✅ Create and manage courses with unique codes

✅ Create individual and group assignments

✅ Enroll students via email invitation

✅ View real-time submission analytics

✅ Monitor student and group progress

✅ Track assignment completion rates

## 📊 Key Features

### 🎯 Course Management

-Create courses with unique codes and descriptions
-Enroll students via email invitation system
-Responsive course cards with progress indicators
-Course-specific assignment tracking

### 📝 Assignment System

-Individual and group assignment types
-OneDrive integration for file submissions
-Two-step submission acknowledgment process
-Deadline tracking with visual overdue indicators
-Maximum marks and grading system

### 👥 Group Functionality

-Student-led group creation and management
-Member invitation and management system
-Group leader submission privileges
-Shared submission status across group members
-Group progress tracking

### 📈 Analytics & Progress Tracking

-Real-time submission tracking for professors
-Visual progress bars and completion rates
-Student performance metrics and averages
-Course completion statistics
-Submission rate analytics

### 🗂 API Endpoints

-Authentication
POST /api/auth/register - User registration (Student/Professor)
POST /api/auth/login - User login with JWT

-Courses
GET /api/courses - Get user-specific courses
POST /api/courses - Create course (Admin only)
GET /api/courses/:id - Get course details
POST /api/courses/:id/enroll - Enroll student in course

-Assignments
GET /api/assignments - Get assignments (with filters)
POST /api/assignments - Create assignment (Admin only)
GET /api/assignments/:id - Get assignment details
GET /api/assignments/:id/submissions - View submissions (Admin)

-Submissions
POST /api/submissions - Submit/acknowledge assignment
GET /api/submissions/my-submissions - Get user's submissions
PUT /api/submissions/:id - Grade submission (Admin)

-Analytics
GET /api/analytics/overview - Professor dashboard analytics
GET /api/analytics/student/dashboard - Student progress analytics
GET /api/analytics/course/:courseId - Course-specific analytics

### 🐳 Docker Deployment

Development
bash

# Full stack with local MongoDB (if needed)

docker-compose up --build

# View logs

docker-compose logs -f backend
Production (MongoDB Atlas)
bash

# Using cloud database

docker-compose up --build

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

3. Access the application(Locally):

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🎓 Project Context

### 🎯 Round 2 Achievements

✅ Enhanced UI/UX with modern design, animations, and responsive layout
✅ MongoDB Atlas Integration with cloud database management
✅ Role-based Dashboards with tailored user experiences
✅ Advanced Analytics for real-time progress tracking
✅ Group Management with leader privileges and member coordination
✅ Production-Ready Architecture with proper error handling
✅ Docker Containerization for easy development and deployment
✅ Comprehensive API with proper authentication and authorization
✅ Two-step Submission System with acknowledgment workflow

## 📄 License

MIT License

## 👤 Author

Suresh Choudhary
