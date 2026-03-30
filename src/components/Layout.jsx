import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from './Navbar';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Floating Quick Help Button */}
      <Link
        to="/help"
        className="fixed bottom-8 right-8 z-50 group"
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-red-500 text-white p-4 rounded-full shadow-xl flex items-center gap-2"
        >
          <Heart className="w-6 h-6 fill-current" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold">
            Get Help
          </span>
        </motion.div>
      </Link>

      <footer className="bg-brand-bg border-t border-brand-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-brand-muted text-sm serif italic max-w-lg mx-auto">
            "Let's build a world where asking for help is strength, not fear."
          </p>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center">
                <Heart className="w-3 h-3 text-brand-bg fill-current" />
              </div>
              <span className="serif text-lg font-semibold text-brand-text">Resilient Roots</span>
            </div>
            <p className="text-brand-muted text-xs">
              &copy; {new Date().getFullYear()} Resilient Roots | GDG on Campus CVR | vignay reddy
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
