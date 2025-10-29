import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import ManagerDashboard from './components/manager/ManagerDashboard';
import ReceiverDashboard from './components/receiver/ReceiverDashboard';
import ScanningSession from './components/receiver/ScanningSession';
import SessionReview from './components/SessionReview';
import Sidebar from './components/Sidebar';
import ScanningHistory from './components/receiver/ScanningHistory';
import MyAllergens from './components/receiver/MyAllergens';
import AllergenEducation from './components/AllergenEducation';
import './styles/App.css';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, userProfile } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && userProfile?.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Dashboard Router
const DashboardRouter = () => {
  const { userProfile } = useAuth();

  if (userProfile?.role === 'manager') {
    return <ManagerDashboard />;
  } else if (userProfile?.role === 'receiver') {
    return <ReceiverDashboard />;
  }

  return <Navigate to="/login" />;
};

function AppContent() {
  const { currentUser } = useAuth();

  return (
    <Router>
      <div className="app">
        {currentUser && <Sidebar />}
        <div className={`app-content ${currentUser ? 'with-sidebar' : ''}`}>
          <Routes>
            <Route
              path="/login"
              element={
                currentUser ? <Navigate to="/dashboard" /> : <Login />
              }
            />
            <Route
              path="/signup"
              element={
                currentUser ? <Navigate to="/dashboard" /> : <Signup />
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scan"
              element={
                <ProtectedRoute requiredRole="receiver">
                  <ScanningSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute requiredRole="receiver">
                  <ScanningHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-allergens"
              element={
                <ProtectedRoute requiredRole="receiver">
                  <MyAllergens />
                </ProtectedRoute>
              }
            />
            <Route
              path="/allergen-guide"
              element={
                <ProtectedRoute requiredRole="receiver">
                  <AllergenEducation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/review"
              element={
                <ProtectedRoute requiredRole="receiver">
                  <SessionReview />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
