import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area
} from 'recharts';
import { 
  BarChart3, TrendingUp, Users, AlertCircle, Download, 
  Calendar, Moon, Zap, MessageSquare, Heart, HandHelping,
  Globe, Share2, Sparkles, ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import { db, collection, onSnapshot, handleFirestoreError, OperationType, query, orderBy, limit as firestoreLimit } from '../firebase';

const COLORS = ['#4d7c0f', '#0891b2', '#7c3aed', '#e11d48', '#d97706'];

export default function NGODashboard() {
  const [stats, setStats] = useState({
    beneficiaries: 0,
    activePrograms: 4,
    impactScore: "9.2",
    resourceViews: 1240,
    helpRequests: 0
  });

  const [impactData, setImpactData] = useState([
    { name: 'Mon', impact: 45 },
    { name: 'Tue', impact: 52 },
    { name: 'Wed', impact: 48 },
    { name: 'Thu', impact: 61 },
    { name: 'Fri', impact: 55 },
    { name: 'Sat', impact: 67 },
    { name: 'Sun', impact: 72 },
  ]);

  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, beneficiaries: snap.size }));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'users'));

    const unsubRequests = onSnapshot(query(collection(db, 'help_requests'), orderBy('createdAt', 'desc'), firestoreLimit(5)), (snap) => {
      setStats(prev => ({ ...prev, helpRequests: snap.size }));
      setRecentRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'help_requests'));

    return () => {
      unsubUsers();
      unsubRequests();
    };
  }, []);

  return (
    <div className="space-y-16 pb-20 max-w-7xl mx-auto">
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-sage-100 rounded-full text-[10px] font-black text-sage-600 uppercase tracking-[0.3em] shadow-sm">
            <HandHelping className="w-4 h-4" />
            NGO Partner Portal
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-sage-700 tracking-tight">Impact Dashboard</h1>
          <p className="text-stone-500 text-xl italic font-serif leading-relaxed">Monitoring your organization's reach and community support.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-8 py-4 bg-white/80 backdrop-blur-xl border border-sage-100 rounded-2xl text-sage-700 hover:bg-sage-50 transition-all flex items-center gap-3 text-sm font-black uppercase tracking-widest shadow-xl shadow-sage-600/5">
            <Globe className="w-5 h-5" />
            Public Profile
          </button>
          <button className="px-8 py-4 bg-sage-600 text-white rounded-2xl hover:bg-sage-700 transition-all flex items-center gap-3 text-sm font-black uppercase tracking-widest shadow-2xl shadow-sage-600/20">
            <Share2 className="w-5 h-5" />
            Share Impact
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: "Beneficiaries", value: stats.beneficiaries, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Active Programs", value: stats.activePrograms, icon: Sparkles, color: "text-indigo-600 bg-indigo-50" },
          { label: "Impact Score", value: stats.impactScore, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
          { label: "Help Requests", value: stats.helpRequests, icon: AlertCircle, color: "text-rose-600 bg-rose-50" }
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
        {/* Impact Trend Chart */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-xl shadow-sage-600/5 border border-sage-100 p-12 space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-3xl font-bold text-sage-700">Weekly Impact Pulse</h2>
            <div className="flex items-center gap-3 text-stone-400 text-[10px] font-black uppercase tracking-widest">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              +15% reach this week
            </div>
          </div>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={impactData}>
                <defs>
                  <linearGradient id="colorImpact" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="impact" stroke="#4d7c0f" strokeWidth={4} fillOpacity={1} fill="url(#colorImpact)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Help Requests */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-xl shadow-sage-600/5 border border-sage-100 p-12 space-y-10">
          <h2 className="font-serif text-3xl font-bold text-sage-700">Urgent Requests</h2>
          <div className="space-y-6">
            {recentRequests.length > 0 ? recentRequests.map((req, i) => (
              <div key={req.id} className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100 space-y-3 group hover:bg-rose-50 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{req.status || 'Pending'}</span>
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">
                    {req.createdAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-stone-700 font-serif italic text-sm line-clamp-2">"{req.message}"</p>
                <div className="flex items-center gap-2 text-rose-600 text-[10px] font-black uppercase tracking-widest">
                  View Details
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-stone-400 font-serif italic">No pending requests.</div>
            )}
          </div>
          <button className="w-full py-4 bg-sage-50 text-sage-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-sage-600 hover:text-white transition-all border border-sage-100">
            View All Requests
          </button>
        </div>
      </div>
    </div>
  );
}
