import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import Help from './pages/Help';
import AdminDashboard from './pages/AdminDashboard';
import NGODashboard from './pages/NGODashboard';
import NGO from './pages/NGO';
import Resources from './pages/Resources';
import Activities from './pages/Activities';
import MoodPage from './pages/MoodPage';
import SleepPage from './pages/SleepPage';
import StressPage from './pages/StressPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { useAuth } from './contexts/AuthContext';
import { useStreak } from './contexts/StreakContext';

// Activity Tracker Component
const ActivityTracker = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { updateStreak } = useStreak();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      updateStreak();
    }
  }, [location.pathname, user, updateStreak]);

  return <>{children}</>;
};

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false, ngoOnly = false }: { children: React.ReactNode, adminOnly?: boolean, ngoOnly?: boolean }) => {
  const { user, profile, loading, isAdmin, isNGO } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (ngoOnly && !isNGO && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <ActivityTracker>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            
            {/* Protected Routes */}
            <Route path="dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="community" element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            } />
            
            <Route path="help" element={
              <ProtectedRoute>
                <Help />
              </ProtectedRoute>
            } />

            <Route path="resources" element={
              <ProtectedRoute>
                <Resources />
              </ProtectedRoute>
            } />
            
            <Route path="activities" element={
              <ProtectedRoute>
                <Activities />
              </ProtectedRoute>
            } />

            <Route path="mood" element={
              <ProtectedRoute>
                <MoodPage />
              </ProtectedRoute>
            } />

            <Route path="sleep" element={
              <ProtectedRoute>
                <SleepPage />
              </ProtectedRoute>
            } />

            <Route path="stress" element={
              <ProtectedRoute>
                <StressPage />
              </ProtectedRoute>
            } />
            
            {/* Admin Only Route */}
            <Route path="admin" element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* NGO Only Route */}
            <Route path="ngo-dashboard" element={
              <ProtectedRoute ngoOnly={true}>
                <NGODashboard />
              </ProtectedRoute>
            } />

            <Route path="ngo" element={
              <ProtectedRoute adminOnly={true}>
                <NGO />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ActivityTracker>
    </BrowserRouter>
  );
}
