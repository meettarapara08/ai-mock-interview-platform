import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import DesignSystem from './pages/DesignSystem';

import './App.css';

export function App() {
  return (
    <Routes>
      {/* Dashboard layout with sidebar + header */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        {/* Placeholder routes for sidebar navigation */}
        <Route path="/resume-interview" element={<PlaceholderPage title="Resume-Based Interview" />} />
        <Route path="/technical-interview" element={<PlaceholderPage title="Technical Interview" />} />
        <Route path="/behavioral-interview" element={<PlaceholderPage title="Behavioral Interview" />} />
        <Route path="/hr-interview" element={<PlaceholderPage title="HR / Managerial Interview" />} />
        <Route path="/coding-practice" element={<PlaceholderPage title="Coding Practice" />} />
        <Route path="/history" element={<PlaceholderPage title="Interview History" />} />
        <Route path="/analytics" element={<PlaceholderPage title="Progress & Analytics" />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
      </Route>
      {/* Standalone design system showcase */}
      <Route path="/design-system" element={<DesignSystem />} />
    </Routes>
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
