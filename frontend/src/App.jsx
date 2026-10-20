import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import DesignSystem from './pages/DesignSystem';
import InterviewSetup from './pages/InterviewSetup';
import InterviewSession from './pages/InterviewSession';
import InterviewResult from './pages/InterviewResult';
import InterviewHistory from './pages/InterviewHistory';
import CodingProblemsList from './pages/CodingProblemsList';
import CodingWorkspace from './pages/CodingWorkspace';
import ResumeInterview from './pages/ResumeInterview';
import Analytics from './pages/Analytics';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminRoles from './pages/admin/AdminRoles';
import AdminCoding from './pages/admin/AdminCoding';

import './App.css';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes requiring session authentication */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Profile />} />

            {/* Interview Module routes */}
            <Route path="/interview/setup" element={<InterviewSetup />} />
            <Route path="/interview/session/:id" element={<InterviewSession />} />
            <Route path="/interview/result/:id" element={<InterviewResult />} />
            <Route path="/history" element={<InterviewHistory />} />

            {/* Friendly redirects for specific interview types */}
            <Route path="/technical-interview" element={<Navigate to="/interview/setup?type=technical" replace />} />
            <Route path="/behavioral-interview" element={<Navigate to="/interview/setup?type=behavioral" replace />} />
            <Route path="/hr-interview" element={<Navigate to="/interview/setup?type=hr" replace />} />

            {/* Resume-Based Interview */}
            <Route path="/resume-interview" element={<ResumeInterview />} />
            <Route path="/coding-practice" element={<CodingProblemsList />} />
            <Route path="/coding-practice/:slug" element={<CodingWorkspace />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>
        </Route>

        {/* Admin Portal Protected Routes */}
        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/questions" element={<AdminQuestions />} />
            <Route path="/admin/roles" element={<AdminRoles />} />
            <Route path="/admin/coding" element={<AdminCoding />} />
          </Route>
        </Route>

        {/* Standalone design system showcase */}
        <Route path="/design-system" element={<DesignSystem />} />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

/* Temporary placeholder for unimplemented pages */
function PlaceholderPage({ title }) {
  return (
    <div className="placeholder-page">
      <h1>{title}</h1>
      <p>This page is coming soon.</p>
    </div>
  );
}

export default App;
