import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Smile, Frown, Meh, Heart, Sparkles, BookOpen, MessageSquare, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, limit, handleFirestoreError, OperationType } from '../firebase';

const moods = [
  { emoji: <Smile className="w-8 h-8" />, label: "Great", color: "text-emerald-600 bg-emerald-50" },
  { emoji: <Meh className="w-8 h-8" />, label: "Okay", color: "text-amber-600 bg-amber-50" },
  { emoji: <Frown className="w-8 h-8" />, label: "Not Good", color: "text-rose-600 bg-rose-50" },
];

const resources = [
  { title: "Managing Academic Stress", category: "Article", time: "5 min read", icon: BookOpen },
  { title: "Building Healthy Friendships", category: "Video", time: "10 min watch", icon: Sparkles },
  { title: "Mindfulness for Beginners", category: "Guide", time: "15 min read", icon: Heart },
  { title: "Understanding Your Emotions", category: "Podcast", time: "12 min listen", icon: MessageSquare },
];

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'moods'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMoodHistory(history);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'moods');
    });

    return () => unsubscribe();
  }, [user]);

  const handleMoodSelect = async (moodLabel) => {
    if (!user || isSubmitting) return;
    
    setIsSubmitting(true);
    setSelectedMood(moodLabel);

    try {
      await addDoc(collection(db, 'moods'), {
        uid: user.uid,
        mood: moodLabel,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'moods');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="serif text-4xl font-bold text-brand-text">Welcome back, {profile?.displayName || user?.displayName || "Friend"}.</h1>
        <p className="text-brand-muted">How are you feeling today? Your feelings are valid.</p>
      </header>

      {/* Daily Affirmation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-brand-primary rounded-[32px] p-8 text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Sparkles className="w-32 h-32" />
        </div>
        <div className="space-y-4 relative z-10">
          <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">Daily Affirmation</span>
          <h2 className="serif text-3xl md:text-4xl font-bold italic leading-tight">
            "I am resilient, I am capable, and I am worthy of peace and happiness."
          </h2>
        </div>
        <div className="shrink-0 relative z-10">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Heart className="w-10 h-10 text-white fill-current" />
          </div>
        </div>
      </motion.div>

      {/* Mood Tracker */}
      <section className="card p-8 space-y-6">
        <h2 className="serif text-2xl font-bold text-brand-text">Daily Check-in</h2>
        {!user ? (
          <div className="p-6 bg-brand-bg/50 rounded-2xl text-center space-y-4 border border-brand-border">
            <p className="text-brand-muted font-medium">Sign in to track your mood and see your history.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-4">
              {moods.map((mood) => (
                <button
                  key={mood.label}
                  disabled={isSubmitting}
                  onClick={() => handleMoodSelect(mood.label)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-3xl transition-all border-2",
                    selectedMood === mood.label
                      ? "border-brand-primary bg-brand-primary/10"
                      : "border-transparent bg-brand-bg/50 hover:bg-brand-bg",
                    isSubmitting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn("p-4 rounded-2xl", mood.color)}>
                    {mood.emoji}
                  </div>
                  <span className="font-medium text-brand-text">{mood.label}</span>
                </button>
              ))}
            </div>
            {selectedMood && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-brand-primary/10 rounded-2xl text-brand-primary text-sm italic border border-brand-primary/20"
              >
                Thank you for sharing. Remember, it's okay to feel {selectedMood.toLowerCase()}.
              </motion.div>
            )}
          </>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommended Resources */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="serif text-2xl font-bold text-brand-text">Recommended for You</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search resources..."
                className="pl-10 pr-4 py-2 bg-brand-surface border border-brand-border rounded-full text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              />
              <BookOpen className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((resource, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                className="card p-6 flex items-start gap-4 cursor-pointer hover:border-brand-primary/50 transition-all"
              >
                <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary">
                  <resource.icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">{resource.category}</span>
                  <h3 className="font-bold text-brand-text">{resource.title}</h3>
                  <p className="text-xs text-brand-muted">{resource.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="serif text-2xl font-bold text-brand-text">Quick Support</h2>
          <div className="space-y-4">
            <Link to="/help" className="w-full card p-6 text-left hover:border-brand-primary/50 transition-all flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-brand-text">Talk to Someone</h3>
                <p className="text-sm text-brand-muted">Anonymous help-seeking</p>
              </div>
            </Link>
            <Link to="/community" className="w-full card p-6 text-left hover:border-brand-primary/50 transition-all flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-brand-text">Peer Mentorship</h3>
                <p className="text-sm text-brand-muted">Connect with a volunteer</p>
              </div>
            </Link>
          </div>

          <h2 className="serif text-2xl font-bold pt-4 text-brand-text">Mood History</h2>
          <div className="space-y-3">
            {moodHistory.length > 0 ? (
              moodHistory.map((item, i) => (
                <div key={item.id || i} className="flex items-center justify-between p-4 bg-brand-surface rounded-2xl border border-brand-border">
                  <span className="text-sm text-brand-muted">
                    {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString() : 'Just now'}
                  </span>
                  <span className={cn(
                    "text-xs font-bold px-3 py-1 rounded-full",
                    item.mood === "Great" ? "bg-emerald-50 text-emerald-600" :
                    item.mood === "Okay" ? "bg-amber-50 text-amber-600" :
                    "bg-rose-50 text-rose-600"
                  )}>
                    {item.mood}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-brand-muted italic">No entries yet. Start by sharing your mood!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
