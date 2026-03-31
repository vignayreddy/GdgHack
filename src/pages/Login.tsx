import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, signInWithEmailAndPassword, signInWithPopup, googleProvider, handleFirestoreError, OperationType, db, doc, getDoc, setDoc, serverTimestamp } from '../firebase';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, AlertCircle, Chrome } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled. Please enable it in the Firebase Console (Authentication > Sign-in method). If you are the developer, this is a required step.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Failed to log in');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if profile exists, if not create one
      const userRef = doc(db, 'users', user.uid);
      const profileDoc = await getDoc(userRef);

      if (!profileDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: user.email === 'vignayreddymuduganti@gmail.com' ? 'admin' : 'user',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
      }

      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled. Please enable it in the Firebase Console (Authentication > Sign-in method).');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sage-100 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-50 rounded-full blur-3xl animate-pulse" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 border border-sage-100"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-sage-600 text-white rounded-3xl mb-6 shadow-xl shadow-sage-600/20 rotate-3 hover:rotate-0 transition-transform duration-300">
            <LogIn size={40} />
          </div>
          <h2 className="text-4xl font-serif font-bold text-sage-700">Welcome Back</h2>
          <p className="text-stone-500 mt-3 font-medium">Sign in to your Resilient Roots account</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 shadow-sm"
          >
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-black text-sage-700 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-sage-600 transition-colors" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-sage-50/50 border border-sage-100 rounded-2xl focus:ring-2 focus:ring-sage-600 focus:border-transparent outline-none transition-all font-medium"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-sage-700 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-sage-600 transition-colors" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-sage-50/50 border border-sage-100 rounded-2xl focus:ring-2 focus:ring-sage-600 focus:border-transparent outline-none transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-sage-600 text-white rounded-2xl font-bold text-lg hover:bg-sage-700 transition-all shadow-xl shadow-sage-600/20 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative flex items-center justify-center mb-8">
            <div className="border-t border-sage-100 w-full"></div>
            <span className="bg-white/80 backdrop-blur-sm px-4 text-xs font-bold text-stone-400 uppercase tracking-widest absolute">or continue with</span>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-sage-100 text-sage-700 rounded-2xl font-bold hover:bg-sage-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
          >
            <Chrome size={22} className="text-sage-600" />
            Google
          </button>
        </div>

        <div className="mt-10 text-center">
          <p className="text-stone-500 font-medium">
            Don't have an account?{' '}
            <Link to="/signup" className="text-sage-600 font-black hover:underline underline-offset-4">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
