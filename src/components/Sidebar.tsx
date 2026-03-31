import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Heart, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X,
  Info,
  MessageSquare,
  Sparkles,
  Bell,
  Smile,
  Moon,
  Activity,
  HandHelping,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStreak } from '../contexts/StreakContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Sidebar() {
  const { user, isAdmin, isNGO, logout } = useAuth();
  const { streak } = useStreak();
  const [isOpen, setIsOpen] = React.useState(true);
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ...(isAdmin ? [{ to: '/admin', icon: ShieldCheck, label: 'Admin Panel' }] : []),
    ...(isNGO || isAdmin ? [{ to: '/ngo-dashboard', icon: HandHelping, label: 'NGO Portal' }] : []),
    { to: '/community', icon: Users, label: 'Community' },
    { to: '/activities', icon: Sparkles, label: 'Activities' },
    { to: '/mood', icon: Smile, label: 'Mood Tracker' },
    { to: '/sleep', icon: Moon, label: 'Sleep Tracker' },
    { to: '/stress', icon: Activity, label: 'Stress Tracker' },
    { to: '/resources', icon: Info, label: 'NGO Resources' },
    { to: '/help', icon: Heart, label: 'Get Help' },
    ...(isAdmin ? [{ to: '/ngo', icon: BarChart3, label: 'System Stats' }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-lg border border-stone-200"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-sage-100 z-40 flex flex-col shadow-2xl shadow-sage-600/5"
          >
            {/* Logo */}
            <div className="p-8 flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-sage-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sage-600/20 group-hover:rotate-12 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="font-serif text-xl font-bold text-sage-700 tracking-tight">
                NyxWell
              </div>
            </div>

            {/* User Profile Summary */}
            <div className="px-6 mb-8">
              <div className="bg-sage-50 rounded-3xl p-4 border border-sage-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-sage-600 flex items-center justify-center text-white font-bold shadow-md">
                    {user?.displayName?.[0] || 'U'}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="text-sm font-bold text-sage-700 truncate">{user?.displayName || "Friend"}</div>
                    <div className="text-[10px] text-sage-400 font-black uppercase tracking-widest">{isAdmin ? 'Admin' : 'Member'}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-sage-100">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-sage-400" />
                    <span className="text-[10px] font-bold text-sage-600 uppercase tracking-tighter">0 Alerts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto scrollbar-hide px-4 py-2 space-y-8">
              {/* Navigation */}
              <nav className="space-y-1.5">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group",
                      isActive 
                        ? "bg-sage-600 text-white shadow-lg shadow-sage-600/20" 
                        : "text-stone-400 hover:bg-sage-50 hover:text-sage-700"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110")} />
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              {/* Streak Widget */}
              <div className="mb-6">
                <div className="bg-orange-50 rounded-3xl p-4 border border-orange-100 flex items-center gap-4 shadow-sm">
                  <div className="bg-white p-2.5 rounded-xl shadow-sm">
                    <div className="text-orange-500 font-bold text-lg">🔥</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Daily Streak</div>
                    <div className="text-sm font-bold text-sage-700">{streak?.currentStreak || 0} Days</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="p-4 border-t border-sage-50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all group"
              >
                <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Logout
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
