import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, TrendingUp, Users, AlertCircle, Download, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, collection, onSnapshot, handleFirestoreError, OperationType } from '../firebase';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e'];

export default function NGO() {
  const [stats, setStats] = useState({
    activeYouth: 0,
    helpRequests: 0,
    mentorsActive: 0,
    avgMood: "0.0"
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

  const [trendData] = useState([
    { date: '2024-03-24', score: 65 },
    { date: '2024-03-25', score: 68 },
    { date: '2024-03-26', score: 62 },
    { date: '2024-03-27', score: 70 },
    { date: '2024-03-28', score: 75 },
    { date: '2024-03-29', score: 72 },
    { date: '2024-03-30', score: 78 },
  ]);

  useEffect(() => {
    // Real-time stats from Firestore
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

    return () => {
      unsubUsers();
      unsubRequests();
      unsubMentors();
      unsubMoods();
    };
  }, []);

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold text-stone-900">NGO Wellbeing Dashboard</h1>
          <p className="text-stone-500">Data-driven insights for organizations to monitor and act.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </button>
          <button className="px-4 py-2 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Youth", value: stats.activeYouth.toLocaleString(), icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Help Requests", value: stats.helpRequests.toLocaleString(), icon: AlertCircle, color: "text-rose-600 bg-rose-50" },
          { label: "Mentors Active", value: stats.mentorsActive.toLocaleString(), icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
          { label: "Avg. Mood Score", value: `${stats.avgMood}/10`, icon: BarChart3, color: "text-purple-600 bg-purple-50" }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 flex items-center gap-4"
          >
            <div className={cn("p-3 rounded-xl", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-stone-400 text-xs font-bold uppercase tracking-wider">{stat.label}</div>
              <div className="font-serif text-2xl font-bold text-stone-900">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mood Trend Chart */}
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8 space-y-6">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Mood Check-ins (Daily)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b' }}
                />
                <Bar dataKey="count" fill="#1c1917" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8 space-y-6">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Issues Distribution</h2>
          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {categoryData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs font-medium text-stone-500">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wellbeing Index Trend */}
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8 space-y-6 lg:col-span-2">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Overall Wellbeing Index</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#1c1917" 
                  strokeWidth={3} 
                  dot={{ r: 6, fill: '#1c1917', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
