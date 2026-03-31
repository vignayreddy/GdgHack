import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area
} from 'recharts';
import { 
  BarChart3, TrendingUp, Users, AlertCircle, Download, 
  Calendar, Moon, Zap, MessageSquare, Heart, ShieldCheck,
  Activity, Database, Lock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { db, collection, onSnapshot, handleFirestoreError, OperationType, query, orderBy, limit as firestoreLimit } from '../firebase';

const COLORS = ['#7c3aed', '#0891b2', '#4d7c0f', '#e11d48', '#d97706'];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeNGOs: 0,
    criticalAlerts: 0,
    systemHealth: "99.9%",
    avgMood: "0.0",
    totalPosts: 0
  });

  const [userGrowth, setUserGrowth] = useState([
    { name: 'Jan', users: 400 },
    { name: 'Feb', users: 600 },
    { name: 'Mar', users: 800 },
    { name: 'Apr', users: 1200 },
    { name: 'May', users: 1500 },
    { name: 'Jun', users: 2100 },
  ]);

  const [roleDistribution, setRoleDistribution] = useState([
    { name: 'Users', value: 0 },
    { name: 'NGOs', value: 0 },
    { name: 'Admins', value: 0 },
  ]);

  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const roles: Record<string, number> = { 'user': 0, 'ngo': 0, 'admin': 0 };
      const users: any[] = [];
      snap.docs.forEach(doc => {
        const data = doc.data();
        const role = data.role || 'user';
        roles[role] = (roles[role] || 0) + 1;
        users.push({ id: doc.id, ...data });
      });
      setStats(prev => ({ ...prev, totalUsers: snap.size, activeNGOs: roles['ngo'] }));
      setRoleDistribution([
        { name: 'Users', value: roles['user'] },
        { name: 'NGOs', value: roles['ngo'] },
        { name: 'Admins', value: roles['admin'] },
      ]);
      setRecentUsers(users.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 5));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'users'));

    const unsubAlerts = onSnapshot(collection(db, 'help_requests'), (snap) => {
      setStats(prev => ({ ...prev, criticalAlerts: snap.size }));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'help_requests'));

    return () => {
      unsubUsers();
      unsubAlerts();
    };
  }, []);

  return (
    <div className="space-y-16 pb-20 max-w-7xl mx-auto">
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-indigo-100 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            Super Admin Control
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-indigo-900 tracking-tight">System Overview</h1>
          <p className="text-stone-500 text-xl italic font-serif leading-relaxed">Global monitoring and infrastructure management.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-8 py-4 bg-white/80 backdrop-blur-xl border border-indigo-100 rounded-2xl text-indigo-700 hover:bg-indigo-50 transition-all flex items-center gap-3 text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-600/5">
            <Database className="w-5 h-5" />
            Logs
          </button>
          <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-3 text-sm font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/20">
            <Lock className="w-5 h-5" />
            Security Audit
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-indigo-600 bg-indigo-50" },
          { label: "Active NGOs", value: stats.activeNGOs, icon: Activity, color: "text-cyan-600 bg-cyan-50" },
          { label: "Critical Alerts", value: stats.criticalAlerts, icon: AlertCircle, color: "text-rose-600 bg-rose-50" },
          { label: "System Health", value: stats.systemHealth, icon: Zap, color: "text-emerald-600 bg-emerald-50" }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-indigo-600/5 border border-indigo-100 p-10 flex items-center gap-8 hover:border-indigo-600/20 transition-all group"
          >
            <div className={cn("p-6 rounded-[2rem] transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg", stat.color)}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <div className="text-stone-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{stat.label}</div>
              <div className="font-serif text-4xl font-bold text-indigo-900">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* User Growth Chart */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-xl shadow-indigo-600/5 border border-indigo-100 p-12 space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-3xl font-bold text-indigo-900">User Growth Trend</h2>
            <div className="flex items-center gap-3 text-stone-400 text-[10px] font-black uppercase tracking-widest">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              +24% this month
            </div>
          </div>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 900 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 900 }} />
                <Tooltip 
                  cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Role Distribution */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-xl shadow-indigo-600/5 border border-indigo-100 p-12 space-y-10">
          <h2 className="font-serif text-3xl font-bold text-indigo-900">User Roles</h2>
          <div className="h-80 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={10}
                  dataKey="value"
                >
                  {roleDistribution.map((entry, index) => (
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
              <span className="text-4xl font-serif font-bold text-indigo-900">{stats.totalUsers}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {roleDistribution.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">{entry.name}</span>
                </div>
                <span className="font-serif font-bold text-indigo-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-xl shadow-indigo-600/5 border border-indigo-100 p-12 space-y-10"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="font-serif text-3xl font-bold text-indigo-900">Recent Registrations</h2>
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">Latest users to join the platform</p>
          </div>
          <button className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">
            View All Users
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-indigo-50">
                <th className="pb-6 text-left text-[10px] font-black text-stone-400 uppercase tracking-widest">User</th>
                <th className="pb-6 text-left text-[10px] font-black text-stone-400 uppercase tracking-widest">Role</th>
                <th className="pb-6 text-left text-[10px] font-black text-stone-400 uppercase tracking-widest">Joined</th>
                <th className="pb-6 text-right text-[10px] font-black text-stone-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {recentUsers.map((user) => (
                <tr key={user.id} className="group hover:bg-indigo-50/30 transition-colors">
                  <td className="py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm shadow-inner">
                        {user.displayName?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="font-serif font-bold text-indigo-900">{user.displayName || 'Anonymous'}</div>
                        <div className="text-[10px] text-stone-400 font-medium">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      user.role === 'admin' ? "bg-rose-50 text-rose-600" : 
                      user.role === 'ngo' ? "bg-cyan-50 text-cyan-600" : 
                      "bg-indigo-50 text-indigo-600"
                    )}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="py-6 text-[10px] font-black text-stone-500 uppercase tracking-widest">
                    {user.createdAt?.toDate()?.toLocaleDateString()}
                  </td>
                  <td className="py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
