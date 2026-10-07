import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BackendStatusBanner } from './components/BackendStatusBanner';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Services } from './pages/Services';
import { MyToken } from './pages/MyToken';
import { QueueStatusPage } from './pages/QueueStatus';
import { CounterDashboard } from './pages/CounterDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

// App Layout with Sidebar, Navbar, and Banner
const MainLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      {/* Top Backend Connectivity Banner */}
      <BackendStatusBanner />

      <div className="flex flex-1 min-h-[calc(100vh-2.5rem)]">
        {/* Sidebar */}
        <Sidebar
          isMobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

// Root index redirect based on role
const RootIndexRedirect: React.FC = () => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  if (role === 'COUNTER') {
    return <Navigate to="/counter" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RootIndexRedirect />} />
            
            {/* User Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Service Selection / Join Queue */}
            <Route
              path="/services"
              element={
                <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                  <Services />
                </ProtectedRoute>
              }
            />

            {/* My Token */}
            <Route
              path="/my-token"
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <MyToken />
                </ProtectedRoute>
              }
            />

            {/* Live Queue Status */}
            <Route
              path="/queue-status"
              element={
                <ProtectedRoute allowedRoles={['USER', 'COUNTER', 'ADMIN']}>
                  <QueueStatusPage />
                </ProtectedRoute>
              }
            />

            {/* Counter Dashboard */}
            <Route
              path="/counter"
              element={
                <ProtectedRoute allowedRoles={['COUNTER', 'ADMIN']}>
                  <CounterDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Dashboard */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
