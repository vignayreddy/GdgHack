import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, MessageCircle, Star, ShieldCheck, Search, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, collection, query, onSnapshot, handleFirestoreError, OperationType } from '../firebase';

export default function Community() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'mentors'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mentorList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMentors(mentorList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'mentors');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredMentors = mentors.filter(m => 
    (m.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (m.specialty?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-20">
      <header className="space-y-4">
        <h1 className="font-serif text-4xl font-bold text-stone-900">Peer Mentorship Network</h1>
        <p className="text-stone-500 max-w-2xl">
          Connect with trained volunteers and peer mentors who understand what you're going through. 
          Our community is built on trust, empathy, and shared experiences.
        </p>
      </header>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by specialty or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/20"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 rounded-2xl text-stone-900 hover:bg-stone-50 transition-colors">
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Mentor Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-stone-100 rounded-3xl h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredMentors.map((mentor, i) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 flex flex-col items-center text-center space-y-4 group cursor-pointer hover:border-stone-900/20 transition-all"
            >
              <div className="relative">
                <img
                  src={mentor.image || `https://picsum.photos/seed/${mentor.id}/200/200`}
                  alt={mentor.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white group-hover:border-stone-900 transition-colors"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full border-2 border-white" />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-stone-900">{mentor.name}</h3>
                <div className="flex items-center justify-center gap-1 text-xs text-stone-900 font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  {mentor.role}
                </div>
              </div>

              <div className="px-3 py-1 bg-stone-900/5 rounded-full text-xs font-medium text-stone-900">
                {mentor.specialty}
              </div>

              <div className="flex items-center gap-1 text-amber-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold text-stone-900">{mentor.rating || 5.0}</span>
                <span className="text-xs text-stone-400">({mentor.reviews || 0})</span>
              </div>

              <button className="w-full py-2 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Connect Now
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Call to Action */}
      <section className="bg-white rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-stone-200">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Want to help others?</h2>
          <p className="text-stone-500">Join our volunteer program and become a peer mentor.</p>
        </div>
        <button className="px-6 py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors whitespace-nowrap">Apply as Volunteer</button>
      </section>
    </div>
  );
}
