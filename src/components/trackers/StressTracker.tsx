import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Plus, History, TrendingUp, Activity } from 'lucide-react';
import { db, collection, addDoc, serverTimestamp, query, where, orderBy, limit, onSnapshot, handleFirestoreError, OperationType } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StressTracker() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState(5);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'stress'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(7)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().timestamp?.toDate()?.toLocaleDateString('en-US', { weekday: 'short' }) || ''
      })).reverse();
      setHistory(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'stress'));

    return () => unsubscribe();
  }, [user]);

  const recordStress = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'stress'), {
        userId: user.uid,
        level,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'stress');
    }
  };

  const chartData = history.map(h => ({
    name: h.date,
    level: h.level
  }));

  return (
    <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 rounded-xl">
            <AlertCircle className="w-5 h-5 text-rose-600" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-stone-900">Stress Rate</h3>
        </div>
        <Activity className="w-5 h-5 text-stone-300" />
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-stone-400 uppercase tracking-widest text-[10px]">Stress Level (1-10)</span>
            <span className="text-2xl font-serif font-bold text-stone-900">{level}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            step="1"
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-900"
          />
          <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            <span>Calm</span>
            <span>Intense</span>
          </div>
        </div>

        <button 
          onClick={recordStress}
          className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Log Stress
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-stone-400 uppercase tracking-widest text-[10px]">Weekly Trend</span>
          <span className="text-stone-400 italic text-xs">Last 7 logs</span>
        </div>
        <div className="h-40 w-full">
          {loading ? (
            <div className="w-full h-full bg-stone-50 animate-pulse rounded-xl" />
          ) : history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a8a29e', fontSize: 10 }} 
                />
                <YAxis hide domain={[0, 10]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="level" 
                  stroke="#f43f5e" 
                  fillOpacity={1} 
                  fill="url(#colorStress)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm italic">
              No data yet. Start tracking!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
