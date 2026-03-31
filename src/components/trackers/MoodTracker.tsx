import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Smile, Meh, Frown, Plus, History, TrendingUp } from 'lucide-react';
import { db, collection, addDoc, serverTimestamp, query, where, orderBy, limit, onSnapshot, handleFirestoreError, OperationType } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MOODS = [
  { label: 'Great', emoji: '😊', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', value: 10 },
  { label: 'Good', emoji: '🙂', color: 'bg-blue-50 text-blue-600 border-blue-200', value: 8 },
  { label: 'Okay', emoji: '😐', color: 'bg-stone-50 text-stone-600 border-stone-200', value: 5 },
  { label: 'Not Good', emoji: '😔', color: 'bg-orange-50 text-orange-600 border-orange-200', value: 3 },
  { label: 'Awful', emoji: '😫', color: 'bg-rose-50 text-rose-600 border-rose-200', value: 1 },
];

export default function MoodTracker() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'moods'),
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
    }, (err) => handleFirestoreError(err, OperationType.GET, 'moods'));

    return () => unsubscribe();
  }, [user]);

  const recordMood = async (mood: typeof MOODS[0]) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'moods'), {
        userId: user.uid,
        mood: mood.label,
        value: mood.value,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'moods');
    }
  };

  const chartData = history.map(h => ({
    name: h.date,
    value: h.value
  }));

  return (
    <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl">
            <Smile className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-stone-900">Mood Tracker</h3>
        </div>
        <TrendingUp className="w-5 h-5 text-stone-300" />
      </div>

      <div className="grid grid-cols-5 gap-3">
        {MOODS.map((m) => (
          <button
            key={m.label}
            onClick={() => recordMood(m)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all group",
              m.color,
              "hover:scale-105 active:scale-95"
            )}
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">{m.emoji}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-stone-400 uppercase tracking-widest text-[10px]">Weekly Trend</span>
          <span className="text-stone-400 italic text-xs">Last 7 check-ins</span>
        </div>
        <div className="h-40 w-full">
          {loading ? (
            <div className="w-full h-full bg-stone-50 animate-pulse rounded-xl" />
          ) : history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
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
