import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Moon, Plus, History, TrendingUp, Clock } from 'lucide-react';
import { db, collection, addDoc, serverTimestamp, query, where, orderBy, limit, onSnapshot, handleFirestoreError, OperationType } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const QUALITIES = ['Poor', 'Fair', 'Good', 'Excellent'];

export default function SleepTracker() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(8);
  const [quality, setQuality] = useState('Good');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'sleep'),
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
    }, (err) => handleFirestoreError(err, OperationType.GET, 'sleep'));

    return () => unsubscribe();
  }, [user]);

  const recordSleep = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'sleep'), {
        userId: user.uid,
        hours,
        quality,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sleep');
    }
  };

  const chartData = history.map(h => ({
    name: h.date,
    hours: h.hours
  }));

  return (
    <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl">
            <Moon className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-stone-900">Sleep Tracker</h3>
        </div>
        <Clock className="w-5 h-5 text-stone-300" />
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-stone-400 uppercase tracking-widest text-[10px]">Hours Slept</span>
            <span className="text-2xl font-serif font-bold text-stone-900">{hours}h</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="12" 
            step="0.5"
            value={hours}
            onChange={(e) => setHours(parseFloat(e.target.value))}
            className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-900"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {QUALITIES.map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all",
                quality === q 
                  ? "bg-stone-900 text-white border-stone-900" 
                  : "bg-white text-stone-400 border-stone-200 hover:border-stone-400"
              )}
            >
              {q}
            </button>
          ))}
        </div>

        <button 
          onClick={recordSleep}
          className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Log Sleep
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
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a8a29e', fontSize: 10 }} 
                />
                <YAxis hide domain={[0, 12]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="hours" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
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
