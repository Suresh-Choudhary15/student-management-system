import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CoursePage from "./pages/CoursePage";
import AssignmentPage from "./pages/AssignmentPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes - Student */}
            <Route
              path="/student"
              element={
                <PrivateRoute requiredRole="student">
                  <StudentDashboard />
                </PrivateRoute>
              }
            />

            {/* Protected Routes - Admin/Professor */}
            <Route
              path="/admin"
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminDashboard />
                </PrivateRoute>
              }
            />

            {/* Protected Routes - Course Pages (Both roles) */}
            <Route
              path="/course/:courseId"
              element={
                <PrivateRoute>
                  <CoursePage />
                </PrivateRoute>
              }
            />

            {/* Protected Routes - Assignment Pages (Both roles) */}
            <Route
              path="/assignment/:assignmentId"
              element={
                <PrivateRoute>
                  <AssignmentPage />
                </PrivateRoute>
              }
            />

            {/* Default Route - Redirect based on auth status */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// 404 Not Found Component
const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <a href="/login" className="btn-primary inline-block">
          Go to Login
        </a>
      </div>
    </div>
  );
};

export default App;
