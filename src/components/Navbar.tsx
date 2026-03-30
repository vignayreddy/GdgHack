import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, LayoutDashboard, Users, HelpCircle, BarChart3, Menu, X, LogIn, LogOut, User as UserIcon, Shield, Flame, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useStreak } from '../contexts/StreakContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, logout } = useAuth();
  const { streak, unreadCount, notifications, markAsRead } = useStreak();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, show: !!user },
    { name: 'Community', path: '/community', icon: Users, show: !!user },
    { name: 'Help Center', path: '/help', icon: HelpCircle, show: !!user },
    { name: 'NGO Portal', path: '/ngo', icon: BarChart3, show: isAdmin },
  ].filter(item => item.show);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-current" />
              </div>
              <span className="font-serif text-xl font-semibold tracking-tight text-stone-900">Resilient Roots</span>
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
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
            
            <div className="h-6 w-px bg-stone-200 mx-2" />

            {user ? (
              <div className="flex items-center gap-4">
                {/* Streak Fire Icon */}
                {streak && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
                    <Flame className={cn("w-4 h-4 fill-current", streak.currentStreak > 0 ? "animate-pulse" : "opacity-50")} />
                    <span className="text-xs font-bold">{streak.currentStreak}</span>
                  </div>
                )}

                {/* Notification Icon */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-stone-400 hover:text-stone-900 transition-colors relative"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-50"
                      >
                        <div className="p-4 border-b border-stone-100 flex justify-between items-center">
                          <h3 className="font-semibold text-stone-900">Notifications</h3>
                          <span className="text-xs text-stone-400">{unreadCount} unread</span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-stone-400">
                              <p className="text-sm">No notifications yet</p>
                            </div>
                          ) : (
                            notifications.map(n => (
                              <div 
                                key={n.id} 
                                onClick={() => markAsRead(n.id)}
                                className={cn(
                                  "p-4 border-b border-stone-50 cursor-pointer hover:bg-stone-50 transition-colors",
                                  !n.read && "bg-blue-50/30"
                                )}
                              >
                                <p className="text-sm font-medium text-stone-900">{n.title}</p>
                                <p className="text-xs text-stone-500 mt-1">{n.message}</p>
                                <p className="text-[10px] text-stone-400 mt-2">
                                  {n.createdAt.toDate().toLocaleTimeString()}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-2 px-3 py-1 bg-stone-50 rounded-full border border-stone-200">
                  {isAdmin ? <Shield className="w-4 h-4 text-stone-900" /> : <UserIcon className="w-4 h-4 text-stone-900" />}
                  <span className="text-xs font-medium text-stone-900">
                    {profile?.displayName || user.displayName || "User"}
                    {isAdmin && <span className="ml-1 text-[10px] uppercase tracking-wider text-stone-400">(Admin)</span>}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-medium bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-stone-500 hover:text-stone-900 focus:outline-none"
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
            className="md:hidden bg-white border-t border-stone-200 overflow-hidden"
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
                      ? "bg-stone-900 text-white"
                      : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
              
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2 p-2">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-center text-sm font-medium text-stone-600 border border-stone-200 rounded-lg"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-center text-sm font-medium bg-stone-900 text-white rounded-lg"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
