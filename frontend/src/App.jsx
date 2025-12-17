import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import LibraryPage from '@/pages/LibraryPage';
import DocumentPage from '@/pages/DocumentPage';
import SearchPage from '@/pages/SearchPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import { Toaster } from '@/components/ui/sonner';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3
};

function AnimatedPage({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/login" element={<AnimatedPage><LoginPage /></AnimatedPage>} />
        <Route path="/signup" element={<AnimatedPage><SignupPage /></AnimatedPage>} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Protected routes */}
        <Route path="/" element={<Navigate to="/documents" replace />} />
        <Route path="/documents" element={
          <ProtectedRoute>
            <AnimatedPage><LibraryPage /></AnimatedPage>
          </ProtectedRoute>
        } />
        <Route path="/search" element={
          <ProtectedRoute>
            <AnimatedPage><SearchPage /></AnimatedPage>
          </ProtectedRoute>
        } />
        <Route path="/documents/:id" element={
          <ProtectedRoute>
            <AnimatedPage><DocumentPage /></AnimatedPage>
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnimatedRoutes />
        <Toaster position="bottom-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
