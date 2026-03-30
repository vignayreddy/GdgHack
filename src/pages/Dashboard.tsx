import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useStreak } from '../contexts/StreakContext';
import { Flame, Calendar as CalendarIcon, CheckCircle2, Users, MessageSquare, Activity, Shield, ArrowRight, Bell, Sparkles, Heart, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, collection, getDocs, query, limit, orderBy } from '../firebase';

export default function Dashboard() {
  const { user, profile, isAdmin } = useAuth();
  const { streak, updateStreak } = useStreak();
  const [showStreakPopup, setShowStreakPopup] = useState(false);

  useEffect(() => {
    if (user) {
      updateStreak();
    }
  }, [user, updateStreak]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    // Show streak popup if streak just updated (simulated for now)
    if (streak && streak.currentStreak > 0) {
      const lastSeenPopup = localStorage.getItem('lastStreakPopup');
      const today = new Date().toISOString().split('T')[0];
      if (lastSeenPopup !== today) {
        setShowStreakPopup(true);
        localStorage.setItem('lastStreakPopup', today);
      }
    }
  }, [streak]);

  useEffect(() => {
    if (isAdmin) {
      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          const q = query(collection(db, 'users'), limit(10), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          setAllUsers(snapshot.docs.map(doc => doc.data()));
        } catch (error) {
          console.error('Error fetching users:', error);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [isAdmin]);

  const recordMood = async (mood: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'moods'), {
        userId: user.uid,
        mood,
        timestamp: serverTimestamp()
      });
      alert(`Mood recorded: ${mood}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'moods');
    }
  };

  const renderCalendar = () => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const monthName = now.toLocaleString('default', { month: 'long' });

    return (
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-stone-400" />
            <h3 className="font-serif text-xl font-bold text-stone-900">{monthName} Activity</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <div className="w-3 h-3 bg-stone-900 rounded-sm"></div>
            <span>Active</span>
            <div className="w-3 h-3 bg-stone-100 rounded-sm ml-2"></div>
            <span>Inactive</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={`header-${day}-${i}`} className="text-center text-[10px] font-bold text-stone-400 uppercase mb-2">
              {day}
            </div>
          ))}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map(day => {
            const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isActive = streak?.history.includes(dateStr);
            const isToday = day === now.getDate();

            return (
              <div
                key={day}
                className={cn(
                  "aspect-square rounded-lg flex items-center justify-center text-sm transition-all relative group",
                  isActive 
                    ? "bg-stone-900 text-white shadow-md" 
                    : "bg-stone-50 text-stone-400 hover:bg-stone-100",
                  isToday && !isActive && "border-2 border-stone-900"
                )}
              >
                {day}
                {isActive && (
                  <CheckCircle2 className="absolute -top-1 -right-1 w-3 h-3 text-green-400 fill-stone-900" />
                )}
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-stone-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                  {isActive ? 'Active Day' : 'No Activity'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Streak Popup */}
      <AnimatePresence>
        {showStreakPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-8 right-8 z-50 bg-stone-900 text-white p-6 rounded-3xl shadow-2xl border border-stone-800 max-w-sm"
          >
            <button 
              onClick={() => setShowStreakPopup(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white"
            >
              <ArrowRight className="w-4 h-4 rotate-45" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center animate-bounce">
                <Flame className="w-8 h-8 text-white fill-current" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-bold">Streak Maintained!</h4>
                <p className="text-stone-400 text-sm">You've been active for {streak?.currentStreak} days in a row. Keep it up!</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Calendar */}
        <div className="lg:col-span-2 space-y-8">
          <header className="mb-8">
            <h1 className="text-4xl font-serif font-bold text-stone-900">
              Welcome back, {profile?.displayName || user?.displayName || 'Friend'}
            </h1>
            <p className="text-stone-500 mt-2 text-lg italic">"Your mental health is a priority. Your happiness is an essential. Your self-care is a necessity."</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-500 rounded-xl">
                  <Flame className="w-5 h-5 text-white fill-current" />
                </div>
                <span className="font-semibold text-orange-900">Current Streak</span>
              </div>
              <p className="text-4xl font-serif font-bold text-orange-900">{streak?.currentStreak || 0} Days</p>
              <p className="text-xs text-orange-600 mt-2">Personal best: 12 days</p>
            </div>

            <div className="bg-stone-900 p-6 rounded-3xl text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-stone-800 rounded-xl">
                  <Activity className="w-5 h-5 text-stone-400" />
                </div>
                <span className="font-semibold text-stone-300">Activity Score</span>
              </div>
              <p className="text-4xl font-serif font-bold">84%</p>
              <p className="text-xs text-stone-500 mt-2">+5% from last week</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-stone-100 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-stone-600" />
                </div>
                <span className="font-semibold text-stone-900">Support Chats</span>
              </div>
              <p className="text-4xl font-serif font-bold text-stone-900">12</p>
              <p className="text-xs text-stone-400 mt-2">3 active sessions</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm">
            <h3 className="font-serif text-2xl font-bold text-stone-900 mb-6">How are you feeling today?</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Great', emoji: '😊', color: 'hover:bg-emerald-50 hover:border-emerald-200' },
                { label: 'Okay', emoji: '😐', color: 'hover:bg-stone-50 hover:border-stone-200' },
                { label: 'Not Good', emoji: '😔', color: 'hover:bg-rose-50 hover:border-rose-200' }
              ].map((m) => (
                <button
                  key={m.label}
                  onClick={() => recordMood(m.label)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border border-stone-100 transition-all group",
                    m.color
                  )}
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{m.emoji}</span>
                  <span className="text-xs font-medium text-stone-500">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {renderCalendar()}
        </div>

        {/* Right Column: Admin or User Sidebar */}
        <div className="space-y-8">
          {isAdmin ? (
            <div className="bg-stone-900 text-white rounded-3xl p-8 border border-stone-800 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-stone-400" />
                <h3 className="font-serif text-2xl font-bold">Admin Overview</h3>
              </div>
              
              <div className="space-y-6">
                <div className="p-4 bg-stone-800 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-stone-400 uppercase tracking-wider">Total Users</span>
                    <Users className="w-4 h-4 text-stone-500" />
                  </div>
                  <p className="text-2xl font-serif font-bold">1,284</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-stone-400 mb-4 uppercase tracking-wider">Recent Registrations</h4>
                  <div className="space-y-3">
                    {loadingUsers ? (
                      <div className="animate-pulse space-y-2">
                        {[1, 2, 3].map(i => <div key={i} className="h-10 bg-stone-800 rounded-xl" />)}
                      </div>
                    ) : (
                      allUsers.map((u, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-stone-800/50 rounded-xl border border-stone-800">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-stone-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                              {u.displayName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-xs font-medium">{u.displayName || 'Anonymous'}</p>
                              <p className="text-[10px] text-stone-500">{u.email}</p>
                            </div>
                          </div>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full",
                            u.role === 'admin' ? "bg-stone-700 text-stone-300" : "bg-stone-800 text-stone-500"
                          )}>
                            {u.role}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button className="w-full py-3 bg-white text-stone-900 rounded-xl font-bold text-sm hover:bg-stone-100 transition-colors flex items-center justify-center gap-2">
                  Access Full NGO Portal
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm">
              <h3 className="font-serif text-2xl font-bold text-stone-900 mb-6">Daily Affirmation</h3>
              <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100 italic text-stone-600">
                "I am resilient. I am strong. I am capable of overcoming any challenge that comes my way. Today is a new opportunity for growth."
              </div>
              
              <div className="mt-8 space-y-4">
                <h4 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">Recommended for you</h4>
                <div className="p-4 border border-stone-100 rounded-2xl hover:border-stone-300 transition-all cursor-pointer group">
                  <p className="font-medium text-stone-900 group-hover:text-stone-700">Mindfulness Meditation</p>
                  <p className="text-xs text-stone-500 mt-1">10 min • Guided Session</p>
                </div>
                <div className="p-4 border border-stone-100 rounded-2xl hover:border-stone-300 transition-all cursor-pointer group">
                  <p className="font-medium text-stone-900 group-hover:text-stone-700">Journaling Prompt</p>
                  <p className="text-xs text-stone-500 mt-1">Reflect on your wins today</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
