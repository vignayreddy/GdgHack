import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, LayoutDashboard, Users, HelpCircle, BarChart3, Menu, X, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Community', path: '/community', icon: Users },
  { name: 'Help Center', path: '/help', icon: HelpCircle },
  { name: 'NGO Portal', path: '/ngo', icon: BarChart3 },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const { user, profile, signIn, logout } = useAuth();

  return (
    <nav className="bg-brand-surface border-b border-brand-border sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-brand-bg fill-current" />
              </div>
              <span className="serif text-xl font-semibold tracking-tight text-brand-text">Resilient Roots</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-3 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                  location.pathname === item.path
                    ? "bg-brand-primary text-brand-bg"
                    : "text-brand-muted hover:bg-brand-border hover:text-brand-text"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
            
            <div className="h-6 w-px bg-brand-border mx-2" />

            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-brand-bg rounded-full border border-brand-border">
                  <UserIcon className="w-4 h-4 text-brand-primary" />
                  <span className="text-xs font-medium text-brand-text">{profile?.displayName || user.displayName || "vignay reddy"}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-brand-muted hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={signIn}
                className="btn-primary flex items-center gap-2 text-sm py-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-brand-muted hover:text-brand-primary focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-brand-surface border-t border-brand-border overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2",
                    location.pathname === item.path
                      ? "bg-brand-primary text-brand-bg"
                      : "text-brand-muted hover:bg-brand-border hover:text-brand-text"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
