import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './AppLayout.css';

export function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main-wrapper">
        <Header />
        <main className="app-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
