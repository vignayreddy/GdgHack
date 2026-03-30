import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, createUserWithEmailAndPassword, signInWithPopup, googleProvider, setDoc, getDoc, doc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { motion } from 'motion/react';
import { UserPlus, Mail, Lock, User, AlertCircle, ShieldCheck, Chrome } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Auto-assign admin role for the specific email
      const finalRole = email === 'vignayreddymuduganti@gmail.com' ? 'admin' : role;

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        role: finalRole,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });

      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled. Please enable it in the Firebase Console (Authentication > Sign-in method). If you are the developer, this is a required step.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please use a different email or sign in.');
      } else {
        setError(err.message || 'Failed to create account');
      }
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
        setError(err.message || 'Failed to sign up with Google');
      }
      console.error('Google signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-stone-200"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-900 text-white rounded-2xl mb-4">
            <UserPlus size={32} />
          </div>
          <h2 className="text-3xl font-serif font-bold text-stone-900">Join Us</h2>
          <p className="text-stone-500 mt-2">Create your account to get started</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Display Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all"
                placeholder="Your Name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Account Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                  role === 'user' 
                    ? 'bg-stone-900 text-white border-stone-900' 
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
              >
                <User size={18} />
                User
              </button>
              <button
                type="button"
                disabled={email !== 'vignayreddymuduganti@gmail.com'}
                onClick={() => setRole('admin')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                  role === 'admin' 
                    ? 'bg-stone-900 text-white border-stone-900' 
                    : email === 'vignayreddymuduganti@gmail.com'
                      ? 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                      : 'bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed'
                }`}
              >
                <ShieldCheck size={18} />
                Admin
              </button>
            </div>
            <p className="mt-2 text-xs text-stone-400 italic">
              {email === 'vignayreddymuduganti@gmail.com' 
                ? "Authorized admin email detected." 
                : "* Admin role creation is restricted to authorized emails."}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-stone-200 w-full"></div>
            <span className="bg-white px-4 text-sm text-stone-400 absolute">or continue with</span>
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-stone-200 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Chrome size={20} />
            Google
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-stone-500">
            Already have an account?{' '}
            <Link to="/login" className="text-stone-900 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
