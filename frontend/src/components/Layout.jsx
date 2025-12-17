import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, Search, User, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { path: '/documents', label: 'Library', icon: FileText },
  { path: '/search', label: 'Search', icon: Search },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--pearl-aqua)]/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-[var(--tropical-teal)]/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-[var(--taupe-grey)]/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--glass-border)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/documents">
              <motion.div
                className="flex items-center space-x-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--pearl-aqua)]/15 border border-[var(--pearl-aqua)]/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[var(--pearl-aqua)]" />
                </div>
                <h1 className="text-2xl font-bold text-[var(--mint-cream)]">DocuMind</h1>
              </motion.div>
            </Link>

            <div className="flex items-center gap-4">
              {/* Navigation */}
              <nav className="flex items-center gap-1">
                {navItems.map(({ path, label, icon: Icon }) => {
                  const isActive = location.pathname === path || (path === '/documents' && location.pathname.startsWith('/documents/'));
                  return (
                    <Link key={path} to={path}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200",
                          isActive
                            ? "bg-[var(--pearl-aqua)]/15 text-[var(--pearl-aqua)] border border-[var(--pearl-aqua)]/30"
                            : "text-[var(--taupe-grey)] hover:text-[var(--mint-cream)] hover:bg-white/5"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{label}</span>
                      </motion.div>
                    </Link>
                  );
                })}
              </nav>

              {/* User Menu */}
              {user && (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-[var(--glass-border)] hover:bg-white/10 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[var(--pearl-aqua)]/15 flex items-center justify-center">
                      <User className="w-4 h-4 text-[var(--pearl-aqua)]" />
                    </div>
                    <span className="text-sm text-[var(--mint-cream)] max-w-[120px] truncate">
                      {user.name || user.email}
                    </span>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-[var(--taupe-grey)] transition-transform",
                      isMenuOpen && "rotate-180"
                    )} />
                  </motion.button>

                  <AnimatePresence>
                    {isMenuOpen && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsMenuOpen(false)}
                        />
                        {/* Dropdown */}
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--shadow-grey)] border border-[var(--glass-border)] shadow-xl z-50 overflow-hidden"
                        >
                          <div className="p-3 border-b border-[var(--glass-border)]">
                            <p className="text-sm font-medium text-[var(--mint-cream)] truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-[var(--taupe-grey)] truncate">
                              {user.email}
                            </p>
                          </div>
                          <div className="p-1">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--taupe-grey)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              Sign out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
