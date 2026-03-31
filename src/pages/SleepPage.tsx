import React from 'react';
import SleepTracker from '../components/trackers/SleepTracker';
import { motion } from 'motion/react';
import { Moon } from 'lucide-react';

export default function SleepPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-20">
      <header className="space-y-6 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-sage-100 rounded-full text-[10px] font-black text-sage-600 uppercase tracking-[0.3em] shadow-sm mx-auto">
          <Moon className="w-4 h-4" />
          Rest & Recovery
        </div>
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-sage-700 tracking-tight">Sleep Tracker</h1>
        <p className="text-stone-500 max-w-2xl mx-auto text-xl italic font-serif leading-relaxed">
          "Sleep is the best meditation. Track your rest to improve your overall health."
        </p>
      </header>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-12 border border-sage-100 shadow-xl shadow-sage-600/5"
      >
        <SleepTracker />
      </motion.div>
    </div>
  );
}
