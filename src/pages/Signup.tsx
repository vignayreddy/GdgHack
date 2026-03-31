import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, createUserWithEmailAndPassword, signInWithPopup, googleProvider, setDoc, getDoc, doc, serverTimestamp, sendEmailVerification } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Mail, Lock, User, AlertCircle, ShieldCheck, Chrome, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);

      // Auto-assign admin role for the specific email
      const finalRole = (email === 'vignayreddymuduganti@gmail.com' || email === 'vr7225274@gmail.com') ? 'admin' : role;

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        role: finalRole,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        emailVerified: false,
      });

      setVerificationSent(true);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled. Please enable it in the Firebase Console.');
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
          role: (user.email === 'vignayreddymuduganti@gmail.com' || user.email === 'vr7225274@gmail.com') ? 'admin' : 'user',
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
    <div className="min-h-screen flex items-center justify-center bg-cream px-4 py-16 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-30">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sage-100 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-orange-50 rounded-full blur-3xl animate-pulse" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 border border-sage-100"
      >
        <AnimatePresence mode="wait">
          {verificationSent ? (
            <motion.div
              key="verification"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8 py-4"
            >
              <div className="inline-flex items-center justify-center w-24 h-24 bg-sage-100 text-sage-600 rounded-[2rem] mb-4 shadow-inner">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-3">
                <h2 className="text-4xl font-serif font-bold text-sage-700">Verify Your Email</h2>
                <p className="text-stone-500 font-medium leading-relaxed">
                  We've sent a verification link to <br/>
                  <span className="font-black text-sage-600 text-lg">{email}</span>.
                </p>
              </div>
              <div className="p-5 bg-sage-50/50 rounded-2xl text-sm text-sage-700 font-medium italic border border-sage-100">
                Please check your inbox (and spam folder) to complete your registration.
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-3 py-4 bg-sage-600 text-white rounded-2xl font-bold text-lg hover:bg-sage-700 transition-all shadow-xl shadow-sage-600/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                Go to Login
                <ArrowRight size={20} />
              </button>
            </motion.div>
          ) : (
            <div key="form">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-sage-600 text-white rounded-3xl mb-6 shadow-xl shadow-sage-600/20 -rotate-3 hover:rotate-0 transition-transform duration-300">
                  <UserPlus size={40} />
                </div>
                <h2 className="text-4xl font-serif font-bold text-sage-700">Join Us</h2>
                <p className="text-stone-500 mt-3 font-medium">Create your account to get started</p>
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

              <form onSubmit={handleSignup} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-sage-700 uppercase tracking-widest ml-1">Display Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-sage-600 transition-colors" size={20} />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-12 pr-5 py-4 bg-sage-50/50 border border-sage-100 rounded-2xl focus:ring-2 focus:ring-sage-600 focus:border-transparent outline-none transition-all font-medium"
                      placeholder="Your Name"
                    />
                  </div>
                </div>

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

                <div className="space-y-3">
                  <label className="block text-xs font-black text-sage-700 uppercase tracking-widest ml-1">Account Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole('user')}
                      className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold ${
                        role === 'user' 
                          ? 'bg-sage-600 text-white border-sage-600 shadow-lg shadow-sage-600/20' 
                          : 'bg-white text-stone-600 border-sage-100 hover:border-sage-300'
                      }`}
                    >
                      <User size={18} />
                      Member
                    </button>
                    <button
                      type="button"
                      disabled={email !== 'vignayreddymuduganti@gmail.com' && email !== 'vr7225274@gmail.com'}
                      onClick={() => setRole('admin')}
                      className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold ${
                        role === 'admin' 
                          ? 'bg-sage-600 text-white border-sage-600 shadow-lg shadow-sage-600/20' 
                          : (email === 'vignayreddymuduganti@gmail.com' || email === 'vr7225274@gmail.com')
                            ? 'bg-white text-stone-600 border-sage-100 hover:border-sage-300'
                            : 'bg-sage-50/50 text-stone-300 border-sage-50 cursor-not-allowed'
                      }`}
                    >
                      <ShieldCheck size={18} />
                      Admin
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest text-center">
                    {(email === 'vignayreddymuduganti@gmail.com' || email === 'vr7225274@gmail.com')
                      ? "Authorized admin email detected." 
                      : "* Admin role creation is restricted to authorized emails."}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-sage-600 text-white rounded-2xl font-bold text-lg hover:bg-sage-700 transition-all shadow-xl shadow-sage-600/20 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : 'Create Account'}
                </button>
              </form>

              <div className="mt-8">
                <div className="relative flex items-center justify-center mb-8">
                  <div className="border-t border-sage-100 w-full"></div>
                  <span className="bg-white/80 backdrop-blur-sm px-4 text-xs font-bold text-stone-400 uppercase tracking-widest absolute">or continue with</span>
                </div>

                <button
                  onClick={handleGoogleSignup}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-sage-100 text-sage-700 rounded-2xl font-bold hover:bg-sage-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Chrome size={22} className="text-sage-600" />
                  Google
                </button>
              </div>

              <div className="mt-10 text-center">
                <p className="text-stone-500 font-medium">
                  Already have an account?{' '}
                  <Link to="/login" className="text-sage-600 font-black hover:underline underline-offset-4">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
