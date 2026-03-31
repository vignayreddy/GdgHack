import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { motion } from 'motion/react';
import { Heart, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {!user && <Navbar />}
      
      <div className="flex flex-grow">
        {user && <Sidebar />}
        
        <main className={cn("flex-grow transition-all duration-500 ease-in-out", user ? "lg:pl-64" : "")}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
          >
            <Outlet />
          </motion.div>

          {/* Floating Quick Help Button */}
          <Link
            to="/help"
            className="fixed bottom-8 right-8 z-50 group"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="bg-sage-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 hover:bg-sage-700 transition-colors"
            >
              <Heart className="w-6 h-6 fill-current" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap">
                Get Help
              </span>
            </motion.div>
          </Link>

          <footer className="bg-white/50 backdrop-blur-sm border-t border-sage-100 py-16 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                <div className="space-y-6 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sage-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sage-600/20">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-serif text-2xl font-bold text-sage-700 tracking-tight">Resilient Roots</span>
                  </div>
                  <p className="text-stone-500 text-sm italic font-serif leading-relaxed max-w-xs">
                    "Let's build a world where asking for help is strength, not fear. Your resilience is our inspiration."
                  </p>
                </div>
                
                <div className="space-y-6 text-left">
                  <h4 className="text-xs font-bold text-sage-700 uppercase tracking-widest">Quick Links</h4>
                  <ul className="space-y-3">
                    <li><Link to="/dashboard" className="text-stone-400 hover:text-sage-600 text-sm transition-colors">Dashboard</Link></li>
                    <li><Link to="/community" className="text-stone-400 hover:text-sage-600 text-sm transition-colors">Community</Link></li>
                    <li><Link to="/help" className="text-stone-400 hover:text-sage-600 text-sm transition-colors">Get Help</Link></li>
                  </ul>
                </div>

                <div className="space-y-6 text-left">
                  <h4 className="text-xs font-bold text-sage-700 uppercase tracking-widest">Support</h4>
                  <p className="text-stone-400 text-sm">
                    Email: <a href="mailto:vignayreddymuduganti@gmail.com" className="text-sage-600 font-bold hover:underline">vignayreddymuduganti@gmail.com</a>
                  </p>
                  <p className="text-stone-400 text-sm">
                    Crisis Helpline: <span className="text-sage-600 font-bold">6303789759</span>
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-sage-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-stone-400 text-xs font-medium">
                  &copy; {new Date().getFullYear()} Resilient Roots | GDG on Campus CVR | vignay reddy
                </p>
                <div className="flex items-center gap-6">
                  <a href="#" className="text-stone-400 hover:text-sage-600 transition-colors"><Heart size={18} /></a>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
