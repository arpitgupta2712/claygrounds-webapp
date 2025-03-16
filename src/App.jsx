import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorProvider, ErrorDisplay } from './context/ErrorContext';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './components/dashboard/Dashboard';
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { withErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './hooks/useToast';

// Import PerformanceMonitor only in development
const PerformanceMonitor = process.env.NODE_ENV === 'development'
  ? React.lazy(() => import('./components/dev/PerformanceMonitor'))
  : () => null;

function AppFallback({ error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-xl p-8 border-l-4 border-error">
        <h1 className="text-2xl font-bold text-error mb-4">Application Error</h1>
        <p className="text-gray-600 mb-6">
          We encountered a critical error while running the application. Please try refreshing the page.
        </p>
        <div className="bg-error-light rounded p-4 mb-6">
          <p className="text-error font-mono text-sm">{error?.message || 'Unknown error occurred'}</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
          >
            Refresh Page
          </button>
          <a
            href="/"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
}

// Create an error boundary wrapped App component
const AppWithErrorBoundary = withErrorBoundary(
  function App() {
    return (
      <Router>
        <AuthProvider>
          <AppProvider>
            <ErrorDisplay />
            <ToastContainer />
            {process.env.NODE_ENV === 'development' && (
              <Suspense fallback={null}>
                <PerformanceMonitor />
              </Suspense>
            )}
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard/*" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AppProvider>
        </AuthProvider>
      </Router>
    );
  },
  {
    fallback: AppFallback,
    context: 'App',
    metadata: {
      feature: 'app',
      importance: 'critical'
    }
  }
);

// Wrap the entire app with ErrorProvider
function App() {
  return (
    <ErrorProvider>
      <AppWithErrorBoundary />
    </ErrorProvider>
  );
}

export default App;