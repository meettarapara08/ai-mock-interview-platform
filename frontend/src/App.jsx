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

            {/* Placeholder routes for sidebar navigation */}
            <Route path="/resume-interview" element={<PlaceholderPage title="Resume-Based Interview" />} />
            <Route path="/technical-interview" element={<PlaceholderPage title="Technical Interview" />} />
            <Route path="/behavioral-interview" element={<PlaceholderPage title="Behavioral Interview" />} />
            <Route path="/hr-interview" element={<PlaceholderPage title="HR / Managerial Interview" />} />
            <Route path="/coding-practice" element={<PlaceholderPage title="Coding Practice" />} />
            <Route path="/history" element={<PlaceholderPage title="Interview History" />} />
            <Route path="/analytics" element={<PlaceholderPage title="Progress & Analytics" />} />
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
