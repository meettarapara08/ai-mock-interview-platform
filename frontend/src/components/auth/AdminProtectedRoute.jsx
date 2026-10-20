import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AdminProtectedRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg, #f8fafc)',
        color: 'var(--color-secondary, #64748b)',
        fontSize: '16px',
        fontWeight: 500,
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '3px solid var(--color-accent-indigo-border, #c7d2fe)',
            borderTopColor: 'var(--color-accent-indigo, #4f46e5)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span>Verifying administrator permissions...</span>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user?.is_staff) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg, #f8fafc)',
        padding: '24px',
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #e2e8f0)',
          borderRadius: '12px',
          padding: '36px 32px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-error-light, #fef2f2)',
            color: 'var(--color-error, #dc2626)',
            marginBottom: '20px',
          }}>
            <ShieldAlert size={32} />
          </div>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--color-primary, #111827)',
            marginBottom: '10px',
          }}>
            Access Denied
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--color-secondary, #64748b)',
            lineHeight: 1.6,
            marginBottom: '24px',
          }}>
            The Admin Portal requires elevated staff credentials. Your account (<strong>{user?.username}</strong>) does not have administrative rights.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: 'var(--color-accent-indigo, #4f46e5)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            <ArrowLeft size={16} />
            Return to Candidate Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

export default AdminProtectedRoute;
