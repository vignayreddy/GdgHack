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
    <nav className="bg-white/80 border-b border-sage-100 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-sage-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-sage-600/20">
                <Heart className="w-5 h-5 text-white fill-current" />
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-sage-700">NyxWell</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2",
                  location.pathname === item.path
                    ? "bg-sage-600 text-white shadow-lg shadow-sage-600/20"
                    : "text-stone-500 hover:bg-sage-50 hover:text-sage-700"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
            
            <div className="h-6 w-px bg-sage-100 mx-2" />

            {user ? (
              <div className="flex items-center gap-4">
                {/* Streak Fire Icon */}
                {streak && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 shadow-sm">
                    <Flame className={cn("w-4 h-4 fill-current", streak.currentStreak > 0 ? "animate-pulse" : "opacity-50")} />
                    <span className="text-xs font-bold">{streak.currentStreak}</span>
                  </div>
                )}

                {/* Notification Icon */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-stone-400 hover:text-sage-600 transition-colors relative bg-sage-50 rounded-full"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-sage-100 overflow-hidden z-50"
                      >
                        <div className="p-4 bg-sage-50 border-b border-sage-100 flex justify-between items-center">
                          <h3 className="font-bold text-sage-700">Notifications</h3>
                          <span className="px-2 py-0.5 bg-sage-600 text-white text-[10px] rounded-full font-bold uppercase tracking-wider">{unreadCount} New</span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-12 text-center text-stone-400">
                              <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                              <p className="text-sm font-medium">All caught up!</p>
                            </div>
                          ) : (
                            notifications.map(n => (
                              <div 
                                key={n.id} 
                                onClick={() => markAsRead(n.id)}
                                className={cn(
                                  "p-4 border-b border-sage-50 cursor-pointer hover:bg-sage-50/50 transition-colors",
                                  !n.read && "bg-sage-50/30"
                                )}
                              >
                                <p className="text-sm font-bold text-stone-900">{n.title}</p>
                                <p className="text-xs text-stone-500 mt-1 leading-relaxed">{n.message}</p>
                                <p className="text-[10px] text-stone-400 mt-2 font-medium">
                                  {n.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-sage-50 rounded-full border border-sage-100">
                  {isAdmin ? <Shield className="w-4 h-4 text-sage-600" /> : <UserIcon className="w-4 h-4 text-sage-600" />}
                  <span className="text-xs font-bold text-sage-700">
                    {profile?.displayName || user.displayName || "Friend"}
                    {isAdmin && <span className="ml-1 text-[10px] text-sage-500 font-bold">(Admin)</span>}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-stone-400 hover:text-red-500 transition-colors bg-stone-50 rounded-full"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-5 py-2 text-sm font-bold text-stone-600 hover:text-sage-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-2.5 text-sm font-bold bg-sage-600 text-white rounded-full hover:bg-sage-700 transition-all shadow-lg shadow-sage-600/20"
                >
                  Join Now
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
