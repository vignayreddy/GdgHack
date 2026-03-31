import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, Calendar, Trophy, ChevronRight, 
  Sparkles, Quote, ArrowUpRight, 
  LayoutDashboard, Activity, Heart,
  Users, MessageSquare, Moon, AlertCircle,
  TrendingUp, Clock, ShieldCheck, ArrowRight,
  Mic, Camera, Brain, X, Award, Zap, Edit2, Save, User as UserIcon,
  Settings, LogOut, Info, Star, History
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStreak } from '../contexts/StreakContext';
import { db, collection, query, orderBy, limit, onSnapshot, handleFirestoreError, OperationType, doc, updateDoc, serverTimestamp, getDocs, where } from '../firebase';
import { cn } from '../lib/utils';
import MoodTracker from '../components/trackers/MoodTracker';
import SleepTracker from '../components/trackers/SleepTracker';
import StressTracker from '../components/trackers/StressTracker';
import { Link } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Dashboard() {
  const { user, isAdmin, profile } = useAuth();
  const { streak, updateStreak } = useStreak();
  const [showCelebration, setShowCelebration] = useState(false);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [greeting, setGreeting] = useState('');
  const [moodHistory, setMoodHistory] = useState<any[]>([]);
  
  // AI States
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isContinuousAnalysis, setIsContinuousAnalysis] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    displayName: profile?.displayName || '',
    bio: profile?.bio || '',
    age: profile?.age || 0,
    gender: profile?.gender || '',
    interests: profile?.interests?.join(', ') || ''
  });

  useEffect(() => {
    if (profile) {
      setEditedProfile({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        age: profile.age || 0,
        gender: profile.gender || '',
        interests: profile.interests?.join(', ') || ''
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: editedProfile.displayName,
        bio: editedProfile.bio,
        age: Number(editedProfile.age),
        gender: editedProfile.gender,
        interests: editedProfile.interests.split(',').map(i => i.trim()).filter(i => i),
        updatedAt: serverTimestamp()
      });
      setIsEditingProfile(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const handleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsAnalyzing(true);
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("API Key missing");
        const genAI = new GoogleGenAI({ apiKey });
        const model = genAI.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Analyze the mood and emotional state of this person based on what they said: "${transcript}". Provide a supportive, brief response (max 2 sentences).`
        });
        const response = await model;
        setAnalysisResult(response.text);
      } catch (error) {
        console.error("AI Analysis error:", error);
        setAnalysisResult("I heard you, but I'm having trouble analyzing the tone right now. You said: " + transcript);
      } finally {
        setIsAnalyzing(false);
      }
    };

    recognition.start();
  };

  const startCamera = async (continuous = false) => {
    setIsCameraOpen(true);
    setIsContinuousAnalysis(continuous);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      if (continuous) {
        analysisIntervalRef.current = setInterval(() => {
          performAnalysis();
        }, 5000); // Analyze every 5 seconds
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera.");
      setIsCameraOpen(false);
      setIsContinuousAnalysis(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    setIsCameraOpen(false);
    setIsContinuousAnalysis(false);
  };

  const performAnalysis = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        
        if (!isContinuousAnalysis) {
          setCapturedImage(imageData);
          stopCamera();
        }

        // Analyze with Gemini
        setIsAnalyzing(true);
        try {
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) throw new Error("API Key missing");
          const genAI = new GoogleGenAI({ apiKey });
          const base64Data = imageData.split(',')[1];
          const response = await genAI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
              parts: [
                { text: "Analyze the facial expression and mood of the person in this image. Provide a supportive, brief response (max 2 sentences)." },
                { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
              ]
            }
          });
          setAnalysisResult(response.text);
        } catch (error) {
          console.error("Image analysis error:", error);
          if (!isContinuousAnalysis) {
            setAnalysisResult("I captured your image, but I'm having trouble analyzing your expression right now.");
          }
        } finally {
          setIsAnalyzing(false);
        }
      }
    }
  };

  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    if (user) {
      updateStreak();
    }
  }, [user, updateStreak]);

  useEffect(() => {
    if (streak?.currentStreak > 0 && localStorage.getItem('lastCelebratedStreak') !== streak.currentStreak.toString()) {
      setShowCelebration(true);
      localStorage.setItem('lastCelebratedStreak', streak.currentStreak.toString());
    }
  }, [streak?.currentStreak]);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snap) => {
      setRecentUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'users'));
    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'moods'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(7)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const history = snap.docs.map(doc => {
        const data = doc.data();
        return {
          date: data.createdAt?.toDate()?.toLocaleDateString('en-US', { weekday: 'short' }) || '',
          value: data.mood === 'happy' ? 5 : data.mood === 'neutral' ? 3 : 1
        };
      }).reverse();
      setMoodHistory(history);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'moods'));
    return () => unsubscribe();
  }, [user]);

  const renderCalendar = () => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDay = startOfMonth.getDay();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isActive = streak?.history.includes(dateStr);
      const isToday = i === today.getDate();

      calendarDays.push(
        <div
          key={i}
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all relative group",
            isActive ? "bg-sage-600 text-white scale-110 shadow-lg shadow-sage-600/20" : "bg-white/5 text-stone-400",
            isToday && !isActive && "border-2 border-sage-600 text-white"
          )}
        >
          {isActive ? (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            i
          )}
          {isToday && isActive && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border border-white" />
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => (
            <div key={`${day}-${idx}`} className="h-8 w-8 flex items-center justify-center text-[10px] font-bold text-stone-500 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarDays}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto">
      {/* AI Quick Assessment Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-sage-700 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-sage-700/20 group"
        >
          <Brain className="absolute -top-10 -right-10 w-48 h-48 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm border border-white/10">
                <Sparkles className="w-3 h-3" />
                AI Quick Check
              </div>
              <h2 className="font-serif text-4xl font-bold leading-tight">How are you, really?</h2>
              <p className="text-white/70 text-lg italic font-serif">Use our AI tools to get an instant mood assessment.</p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleSpeechRecognition}
                disabled={isListening || isAnalyzing}
                className={cn(
                  "flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                  isListening ? "bg-accent text-white animate-pulse" : "bg-white text-sage-700 hover:bg-sage-50"
                )}
              >
                <Mic className="w-4 h-4" />
                {isListening ? "Listening..." : "Speech Check"}
              </button>
              <button 
                onClick={() => isCameraOpen ? stopCamera() : startCamera(true)}
                disabled={isAnalyzing && !isContinuousAnalysis}
                className={cn(
                  "flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                  isCameraOpen ? "bg-accent text-white" : "bg-white text-sage-700 hover:bg-sage-50"
                )}
              >
                <Camera className="w-4 h-4" />
                {isCameraOpen ? "Stop Video Check" : "Video Mood Check"}
              </button>
            </div>

            <AnimatePresence>
              {analysisResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 relative group/result"
                >
                  <button 
                    onClick={() => setAnalysisResult(null)}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/50">AI Insight</div>
                      <p className="text-lg font-serif italic leading-relaxed">{analysisResult}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isCameraOpen && (
              <div className="relative rounded-3xl overflow-hidden border-4 border-white/20">
                <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
                {isContinuousAnalysis ? (
                  <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    Live Analysis
                  </div>
                ) : (
                  <button 
                    onClick={performAnalysis}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-accent text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl"
                  >
                    Capture & Analyze
                  </button>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {isAnalyzing && (
              <div className="flex items-center gap-3 text-white/70 italic animate-pulse">
                <Sparkles className="w-4 h-4" />
                <span>AI is analyzing your well-being...</span>
              </div>
            )}

            <AnimatePresence>
              {analysisResult && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-6 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 text-sage-700" />
                    </div>
                    <p className="text-sm font-serif italic leading-relaxed">{analysisResult}</p>
                    <button onClick={() => setAnalysisResult(null)} className="ml-auto text-white/50 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[3rem] p-10 border-2 border-sage-100 shadow-2xl shadow-sage-600/10 flex flex-col justify-between"
        >
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">
                {greeting}, {profile?.displayName || user?.displayName || 'Friend'}
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="p-3 bg-sage-50 text-sage-600 rounded-2xl hover:bg-sage-100 transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-sage-50 rounded-full text-[10px] font-black text-sage-600 uppercase tracking-widest">
                  <Award className="w-3 h-3" />
                  {streak?.currentStreak || 0} Day Streak
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-sage-50 shadow-xl">
                  <img src={`https://picsum.photos/seed/${user?.uid}/200/200`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1">
                  <h1 className="font-serif text-4xl font-bold text-sage-700">
                    {profile?.displayName || user?.displayName || 'Friend'}
                    {isAdmin && <span className="ml-2 text-sm text-accent font-black uppercase tracking-widest">(Admin)</span>}
                  </h1>
                  <p className="text-stone-400 text-sm font-medium">{user?.email}</p>
                </div>
              </div>
              
              {profile?.bio && (
                <p className="text-stone-500 italic font-serif leading-relaxed text-lg">
                  "{profile.bio}"
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-sage-50 rounded-2xl border border-sage-100">
                  <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Age</div>
                  <div className="text-lg font-bold text-sage-700">{profile?.age || 'Not set'}</div>
                </div>
                <div className="p-4 bg-sage-50 rounded-2xl border border-sage-100">
                  <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Gender</div>
                  <div className="text-lg font-bold text-sage-700">{profile?.gender || 'Not set'}</div>
                </div>
              </div>

              {profile?.interests && profile.interests.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Interests</div>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, idx) => (
                      <span key={idx} className="px-3 py-1 bg-sage-100 text-sage-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-sage-50 flex items-center justify-between">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-sage-100 flex items-center justify-center text-[10px] font-black text-sage-600 overflow-hidden">
                  <img src={`https://picsum.photos/seed/${i}/40/40`} alt="Community Member" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-white bg-sage-600 flex items-center justify-center text-[10px] font-black text-white">
                +12
              </div>
            </div>
            <div className="text-xs font-bold text-stone-400 italic">16 people online now</div>
          </div>
        </motion.div>
      </section>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {isEditingProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sage-900/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="absolute top-8 right-8 p-2 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="font-serif text-3xl font-bold text-sage-700">Update Profile</h2>
                  <p className="text-stone-400 text-xs font-black uppercase tracking-widest">Personalize your experience</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Display Name</label>
                    <input 
                      type="text" 
                      value={editedProfile.displayName}
                      onChange={e => setEditedProfile({...editedProfile, displayName: e.target.value})}
                      placeholder="Display Name"
                      className="w-full p-4 bg-sage-50 border border-sage-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-600/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Bio</label>
                    <textarea 
                      value={editedProfile.bio}
                      onChange={e => setEditedProfile({...editedProfile, bio: e.target.value})}
                      placeholder="Tell us about yourself..."
                      className="w-full p-4 bg-sage-50 border border-sage-100 rounded-2xl text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-sage-600/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Age</label>
                      <input 
                        type="number" 
                        value={editedProfile.age}
                        onChange={e => setEditedProfile({...editedProfile, age: Number(e.target.value)})}
                        placeholder="Age"
                        className="w-full p-4 bg-sage-50 border border-sage-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-600/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Gender</label>
                      <select 
                        value={editedProfile.gender}
                        onChange={e => setEditedProfile({...editedProfile, gender: e.target.value})}
                        className="w-full p-4 bg-sage-50 border border-sage-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-600/20"
                      >
                        <option value="">Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Interests</label>
                    <input 
                      type="text" 
                      value={editedProfile.interests}
                      onChange={e => setEditedProfile({...editedProfile, interests: e.target.value})}
                      placeholder="Interests (comma separated)"
                      className="w-full p-4 bg-sage-50 border border-sage-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-600/20"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSaveProfile}
                  className="w-full py-5 bg-sage-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-sage-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-sage-700/20"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-auto">
        
        {/* Mood Pulse - Large Bento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-8 bg-white/80 backdrop-blur-xl rounded-[3rem] p-12 border border-sage-100 shadow-xl shadow-sage-600/5 hover:shadow-sage-600/10 transition-all group"
        >
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-2">
              <h3 className="font-serif text-4xl font-bold text-sage-700">Mood Pulse</h3>
              <p className="text-stone-400 text-xs font-black uppercase tracking-widest">How are you feeling today?</p>
            </div>
            <div className="p-5 bg-amber-50 rounded-3xl group-hover:scale-110 transition-transform shadow-inner">
              <Sparkles className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          <MoodTracker />
        </motion.div>

        {/* Journey - Sidebar Bento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-4 bg-sage-700 rounded-[3rem] p-12 text-white shadow-2xl space-y-10 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-2">
              <h3 className="font-serif text-3xl font-bold">Your Journey</h3>
              <p className="text-sage-300 text-[10px] font-black uppercase tracking-widest">Activity Calendar</p>
            </div>
            <Calendar className="w-7 h-7 text-sage-300" />
          </div>
          <div className="relative z-10">
            {renderCalendar()}
          </div>
          <div className="pt-8 border-t border-white/10 flex items-center justify-between relative z-10">
            <div className="text-sm font-bold text-sage-300 uppercase tracking-widest">Total Active Days</div>
            <div className="text-3xl font-serif font-bold">{streak?.history.length || 0}</div>
          </div>
        </motion.div>

        {/* Sleep - Medium Bento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-4 bg-white/80 backdrop-blur-xl rounded-[3rem] p-12 border border-sage-100 shadow-xl shadow-sage-600/5 hover:shadow-sage-600/10 transition-all group"
        >
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-2">
              <h3 className="font-serif text-3xl font-bold text-sage-700">Rest</h3>
              <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">Sleep Quality</p>
            </div>
            <div className="p-5 bg-indigo-50 rounded-3xl group-hover:scale-110 transition-transform shadow-inner">
              <Moon className="w-7 h-7 text-indigo-500" />
            </div>
          </div>
          <SleepTracker />
        </motion.div>

        {/* Stress - Medium Bento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-4 bg-white/80 backdrop-blur-xl rounded-[3rem] p-12 border border-sage-100 shadow-xl shadow-sage-600/5 hover:shadow-sage-600/10 transition-all group"
        >
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-2">
              <h3 className="font-serif text-3xl font-bold text-sage-700">Balance</h3>
              <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">Stress Level</p>
            </div>
            <div className="p-5 bg-rose-50 rounded-3xl group-hover:scale-110 transition-transform shadow-inner">
              <Activity className="w-7 h-7 text-rose-500" />
            </div>
          </div>
          <StressTracker />
        </motion.div>

        {/* Community - Medium Bento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-4 bg-sage-50/50 rounded-[3rem] p-12 border border-sage-100 shadow-xl shadow-sage-600/5 hover:shadow-sage-600/10 transition-all group"
        >
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-2">
              <h3 className="font-serif text-3xl font-bold text-sage-700">Community</h3>
              <p className="text-sage-600 text-[10px] font-black uppercase tracking-widest">Connect & Share</p>
            </div>
            <div className="p-5 bg-white rounded-3xl group-hover:scale-110 transition-transform shadow-sm">
              <MessageSquare className="w-7 h-7 text-sage-600" />
            </div>
          </div>
          <div className="space-y-8">
            <p className="text-stone-600 italic font-serif text-xl leading-relaxed">
              "Shared joy is double joy; shared sorrow is half sorrow."
            </p>
            <Link 
              to="/community" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-sage-600 text-white rounded-2xl font-bold text-sm hover:bg-sage-700 transition-all group/btn shadow-lg shadow-sage-600/20"
            >
              Join Discussion
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Admin Overview (Conditional) */}
        {isAdmin && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="md:col-span-12 bg-white/40 backdrop-blur-sm rounded-[3rem] p-12 border border-sage-100 shadow-xl space-y-10"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="font-serif text-4xl font-bold text-sage-700">Admin Overview</h3>
                <p className="text-stone-400 text-xs font-black uppercase tracking-widest">Recent Community Activity</p>
              </div>
              <Link to="/ngo" className="p-5 bg-sage-600 text-white rounded-3xl hover:bg-sage-700 transition-all shadow-xl shadow-sage-600/20">
                <ShieldCheck className="w-8 h-8" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
              {recentUsers.map(u => (
                <div key={u.id} className="bg-white p-5 rounded-[2rem] border border-sage-50 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-sage-100 flex items-center justify-center text-sage-600 font-black text-lg">
                    {u.displayName?.[0] || 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-sage-700 truncate">{u.displayName}</div>
                    <div className="text-[10px] text-stone-400 font-black uppercase tracking-widest">{u.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sage-900/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-16 max-w-md w-full text-center space-y-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-sage-400 via-sage-600 to-sage-800" />
              <div className="flex justify-center">
                <div className="bg-sage-50 p-8 rounded-[2.5rem] relative shadow-inner">
                  <Trophy className="w-20 h-20 text-sage-600" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-3 -right-3 bg-sage-700 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg"
                  >
                    NEW!
                  </motion.div>
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="font-serif text-4xl font-bold text-sage-700">{streak?.currentStreak} Day Streak!</h2>
                <p className="text-stone-500 text-lg font-medium leading-relaxed">You're showing incredible consistency. Keep up the amazing work!</p>
              </div>
              <button
                onClick={() => setShowCelebration(false)}
                className="w-full py-5 bg-sage-600 text-white rounded-[1.5rem] font-bold text-lg hover:bg-sage-700 transition-all shadow-xl shadow-sage-600/20 hover:-translate-y-0.5"
              >
                Continue Journey
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
