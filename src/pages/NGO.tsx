import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area
} from 'recharts';
import { 
  BarChart3, TrendingUp, Users, AlertCircle, Download, 
  Calendar, Moon, Zap, MessageSquare, Heart
} from 'lucide-react';
import { cn } from '../lib/utils';
import { db, collection, onSnapshot, handleFirestoreError, OperationType, query, orderBy, limit as firestoreLimit } from '../firebase';

const COLORS = ['#4d7c0f', '#0891b2', '#7c3aed', '#e11d48', '#d97706'];

export default function NGO() {
  const [stats, setStats] = useState({
    activeYouth: 0,
    helpRequests: 0,
    mentorsActive: 0,
    avgMood: "0.0",
    avgSleep: "0.0",
    avgStress: "0.0",
    totalPosts: 0
  });

  const [moodData, setMoodData] = useState([
    { name: 'Mon', count: 0 },
    { name: 'Tue', count: 0 },
    { name: 'Wed', count: 0 },
    { name: 'Thu', count: 0 },
    { name: 'Fri', count: 0 },
    { name: 'Sat', count: 0 },
    { name: 'Sun', count: 0 },
  ]);

  const [categoryData, setCategoryData] = useState([
    { name: 'Academic Stress', value: 0 },
    { name: 'Social Anxiety', value: 0 },
    { name: 'Family Dynamics', value: 0 },
    { name: 'Other', value: 0 },
  ]);

  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, activeYouth: snap.size }));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'users'));

    const unsubRequests = onSnapshot(collection(db, 'help_requests'), (snap) => {
      setStats(prev => ({ ...prev, helpRequests: snap.size }));
      const categories: Record<string, number> = {};
      snap.docs.forEach(doc => {
        const cat = doc.data().category || 'Other';
        categories[cat] = (categories[cat] || 0) + 1;
      });
      const newCatData = Object.entries(categories).map(([name, value]) => ({ name, value }));
      if (newCatData.length > 0) setCategoryData(newCatData);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'help_requests'));

    const unsubMentors = onSnapshot(collection(db, 'mentors'), (snap) => {
      setStats(prev => ({ ...prev, mentorsActive: snap.size }));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'mentors'));

    const unsubMoods = onSnapshot(collection(db, 'moods'), (snap) => {
      const moods = snap.docs.map(d => d.data().mood);
      const moodValues: Record<string, number> = { 'Great': 10, 'Okay': 5, 'Not Good': 2 };
      const total = moods.reduce((acc, m) => acc + (moodValues[m] || 5), 0);
      setStats(prev => ({ ...prev, avgMood: moods.length ? (total / moods.length).toFixed(1) : "0.0" }));

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const counts: Record<string, number> = {};
      snap.docs.forEach(doc => {
        const date = doc.data().timestamp?.toDate?.();
        if (date) {
          const day = days[date.getDay()];
          counts[day] = (counts[day] || 0) + 1;
        }
      });
      setMoodData(prev => prev.map(d => ({ ...d, count: counts[d.name] || 0 })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'moods'));

    const unsubSleep = onSnapshot(collection(db, 'sleep'), (snap) => {
      const hours = snap.docs.map(d => d.data().hours || 0);
      const total = hours.reduce((acc, h) => acc + h, 0);
      setStats(prev => ({ ...prev, avgSleep: hours.length ? (total / hours.length).toFixed(1) : "0.0" }));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'sleep'));

    const unsubStress = onSnapshot(collection(db, 'stress'), (snap) => {
      const levels = snap.docs.map(d => d.data().level || 0);
      const total = levels.reduce((acc, l) => acc + l, 0);
      setStats(prev => ({ ...prev, avgStress: levels.length ? (total / levels.length).toFixed(1) : "0.0" }));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'stress'));

    const qPosts = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), firestoreLimit(5));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      setStats(prev => ({ ...prev, totalPosts: snap.size }));
      setRecentPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'posts'));

    return () => {
      unsubUsers();
      unsubRequests();
      unsubMentors();
      unsubMoods();
      unsubSleep();
      unsubStress();
      unsubPosts();
    };
  }, []);

  return (
    <div className="space-y-16 pb-20 max-w-7xl mx-auto">
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-sage-100 rounded-full text-[10px] font-black text-sage-600 uppercase tracking-[0.3em] shadow-sm">
            <BarChart3 className="w-4 h-4" />
            Admin Portal
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-sage-700 tracking-tight">Wellbeing Insights</h1>
          <p className="text-stone-500 text-xl italic font-serif leading-relaxed">Real-time data to monitor community health and impact.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-8 py-4 bg-white/80 backdrop-blur-xl border border-sage-100 rounded-2xl text-sage-700 hover:bg-sage-50 transition-all flex items-center gap-3 text-sm font-black uppercase tracking-widest shadow-xl shadow-sage-600/5">
            <Calendar className="w-5 h-5" />
            Last 30 Days
          </button>
          <button className="px-8 py-4 bg-sage-600 text-white rounded-2xl hover:bg-sage-700 transition-all flex items-center gap-3 text-sm font-black uppercase tracking-widest shadow-2xl shadow-sage-600/20">
            <Download className="w-5 h-5" />
            Export Report
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: "Active Youth", value: stats.activeYouth, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Help Requests", value: stats.helpRequests, icon: AlertCircle, color: "text-rose-600 bg-rose-50" },
          { label: "Avg. Sleep", value: `${stats.avgSleep}h`, icon: Moon, color: "text-indigo-600 bg-indigo-50" },
          { label: "Avg. Stress", value: `${stats.avgStress}/10`, icon: Zap, color: "text-amber-600 bg-amber-50" }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-sage-600/5 border border-sage-100 p-10 flex items-center gap-8 hover:border-sage-600/20 transition-all group"
          >
            <div className={cn("p-6 rounded-[2rem] transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg", stat.color)}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <div className="text-stone-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{stat.label}</div>
              <div className="font-serif text-4xl font-bold text-sage-700">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Mood Trend Chart */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-xl shadow-sage-600/5 border border-sage-100 p-12 space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-3xl font-bold text-sage-700">Community Mood Pulse</h2>
            <div className="flex items-center gap-3 text-stone-400 text-[10px] font-black uppercase tracking-widest">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              +12% this week
            </div>
          </div>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moodData}>
                <defs>
                  <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4d7c0f" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4d7c0f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 900 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 900 }} />
                <Tooltip 
                  cursor={{ stroke: '#4d7c0f', strokeWidth: 2 }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="count" stroke="#4d7c0f" strokeWidth={4} fillOpacity={1} fill="url(#colorMood)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-xl shadow-sage-600/5 border border-sage-100 p-12 space-y-10">
          <h2 className="font-serif text-3xl font-bold text-sage-700">Issue Areas</h2>
          <div className="h-80 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={10}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-stone-400 text-[10px] font-black uppercase tracking-[0.3em]">Total</span>
              <span className="text-4xl font-serif font-bold text-sage-700">{stats.helpRequests}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {categoryData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Community Activity Feed */}
        <div className="lg:col-span-3 bg-sage-700 rounded-[4rem] p-16 space-y-12 text-white relative overflow-hidden shadow-2xl shadow-sage-700/20">
          <Sparkles className="absolute -top-10 -right-10 w-64 h-64 text-white/5 rotate-12" />
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-2">
              <h2 className="font-serif text-4xl font-bold">Community Activity</h2>
              <p className="text-white/50 text-lg italic font-serif">Latest posts and interactions from the community feed.</p>
            </div>
            <button className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-sm border border-white/10">
              View All Posts
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            {recentPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6 hover:bg-white/10 transition-all backdrop-blur-sm group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xs font-black shadow-lg">
                    {post.authorName?.[0]}
                  </div>
                  <div>
                    <div className="text-base font-bold">{post.authorName}</div>
                    <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                      {post.createdAt?.toDate()?.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <p className="text-lg text-white/70 line-clamp-2 italic font-serif leading-relaxed">"{post.content}"</p>
                <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-rose-400">
                    <Heart className="w-4 h-4 fill-current" />
                    <span className="text-xs font-black">{post.likes || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-400">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Reply</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
