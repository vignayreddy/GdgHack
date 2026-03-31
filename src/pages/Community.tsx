import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, MessageCircle, Star, ShieldCheck, 
  Search, Filter, Send, Heart, Share2, 
  MoreHorizontal, Plus, Sparkles, Frown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  db, collection, query, onSnapshot, 
  handleFirestoreError, OperationType, 
  addDoc, serverTimestamp, orderBy, 
  updateDoc, doc, increment 
} from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Community() {
  const { user, profile, isAdmin } = useAuth();
  const [mentors, setMentors] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPost, setNewPost] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [activeTab, setActiveTab] = useState<'mentors' | 'feed' | 'groups'>('feed');
  const [showAddProblem, setShowAddProblem] = useState(false);
  const [newProblem, setNewProblem] = useState({ title: '', description: '' });

  const teluguMentors = [
    {
      id: 'm1',
      name: "Dr. Sravanthi Reddy",
      role: "Senior Psychologist",
      specialty: "Anxiety & Depression",
      image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=400&fit=crop",
      rating: 4.9,
      reviews: 124,
      location: "Hyderabad, Telangana",
      languages: ["Telugu", "English", "Hindi"]
    },
    {
      id: 'm2',
      name: "Anil Kumar",
      role: "Peer Counselor",
      specialty: "Student Stress",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      rating: 4.8,
      reviews: 89,
      location: "Vijayawada, Andhra Pradesh",
      languages: ["Telugu", "English"]
    },
    {
      id: 'm3',
      name: "Lakshmi Prasanna",
      role: "Wellness Coach",
      specialty: "Mindfulness & Yoga",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
      rating: 5.0,
      reviews: 56,
      location: "Visakhapatnam, AP",
      languages: ["Telugu", "English"]
    }
  ];

  const initialCommunities = [
    { id: 'c1', title: "Exam Stress Support", description: "Discuss strategies to handle academic pressure and exam anxiety.", members: 1240, icon: "📚" },
    { id: 'c2', title: "Relationship Advice", description: "A safe space to talk about family, friends, and romantic relationships.", members: 850, icon: "❤️" },
    { id: 'c3', title: "Career Guidance", description: "Connect with others navigating career choices and job search stress.", members: 2100, icon: "💼" },
    { id: 'c4', title: "Loneliness & Isolation", description: "You're not alone. Connect with people who understand how you feel.", members: 560, icon: "🤝" }
  ];

  const [communities, setCommunities] = useState(initialCommunities);

  useEffect(() => {
    const qMentors = query(collection(db, 'mentors'));
    const unsubscribeMentors = onSnapshot(qMentors, (snapshot) => {
      const dbMentors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMentors([...teluguMentors, ...dbMentors]);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'mentors'));

    const qPosts = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(qPosts, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'posts'));

    return () => {
      unsubscribeMentors();
      unsubscribePosts();
    };
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPost.trim()) return;

    try {
      let authorName = isAnonymous ? 'Anonymous' : (profile?.displayName || user.displayName || 'Friend');
      if (!isAnonymous && isAdmin) {
        authorName = `${authorName} (Admin)`;
      }

      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        authorName,
        content: newPost,
        isAnonymous,
        likes: [],
        dislikes: [],
        createdAt: serverTimestamp()
      });
      setNewPost('');
      setIsAnonymous(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    }
  };

  const handleLike = async (postId: string, currentLikes: string[] = [], currentDislikes: string[] = []) => {
    if (!user) return;
    try {
      const isLiked = currentLikes.includes(user.uid);
      const isDisliked = currentDislikes.includes(user.uid);

      let newLikes = [...currentLikes];
      let newDislikes = [...currentDislikes];

      if (isLiked) {
        newLikes = newLikes.filter(id => id !== user.uid);
      } else {
        newLikes.push(user.uid);
        if (isDisliked) {
          newDislikes = newDislikes.filter(id => id !== user.uid);
        }
      }

      await updateDoc(doc(db, 'posts', postId), {
        likes: newLikes,
        dislikes: newDislikes
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'posts');
    }
  };

  const handleDislike = async (postId: string, currentLikes: string[] = [], currentDislikes: string[] = []) => {
    if (!user) return;
    try {
      const isLiked = currentLikes.includes(user.uid);
      const isDisliked = currentDislikes.includes(user.uid);

      let newLikes = [...currentLikes];
      let newDislikes = [...currentDislikes];

      if (isDisliked) {
        newDislikes = newDislikes.filter(id => id !== user.uid);
      } else {
        newDislikes.push(user.uid);
        if (isLiked) {
          newLikes = newLikes.filter(id => id !== user.uid);
        }
      }

      await updateDoc(doc(db, 'posts', postId), {
        likes: newLikes,
        dislikes: newDislikes
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'posts');
    }
  };

  const handleShare = async (post: any) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/community#${post.id}`);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await updateDoc(doc(db, 'posts', postId), {
        deleted: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'posts');
    }
  };

  const handleReply = (postId: string) => {
    // For now, just focus the textarea or show a toast
    setNewPost(`@${posts.find(p => p.id === postId)?.authorName} `);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredMentors = mentors.filter(m => 
    (m.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (m.specialty?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-16 pb-20 max-w-5xl mx-auto">
      <header className="space-y-6 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-sage-100 rounded-full text-[10px] font-black text-sage-600 uppercase tracking-[0.2em] shadow-sm">
          <Users className="w-3 h-3" />
          Our Community
        </div>
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-sage-700 tracking-tight">Connect & Grow</h1>
        <p className="text-stone-500 max-w-2xl mx-auto text-xl italic font-serif leading-relaxed">
          "A community is where you find strength when yours is low."
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => setActiveTab('feed')}
          className={cn(
            "px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'feed' 
              ? "bg-sage-600 text-white shadow-xl shadow-sage-600/20" 
              : "bg-white/50 text-sage-400 border border-sage-100 hover:border-sage-300 backdrop-blur-sm"
          )}
        >
          Community Feed
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={cn(
            "px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'groups' 
              ? "bg-sage-600 text-white shadow-xl shadow-sage-600/20" 
              : "bg-white/50 text-sage-400 border border-sage-100 hover:border-sage-300 backdrop-blur-sm"
          )}
        >
          Problem Groups
        </button>
        <button
          onClick={() => setActiveTab('mentors')}
          className={cn(
            "px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'mentors' 
              ? "bg-sage-600 text-white shadow-xl shadow-sage-600/20" 
              : "bg-white/50 text-sage-400 border border-sage-100 hover:border-sage-300 backdrop-blur-sm"
          )}
        >
          Peer Mentors
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'feed' ? (
          <motion.div
            key="feed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            {/* Create Post */}
            <form onSubmit={handleCreatePost} className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 border border-sage-100 shadow-xl shadow-sage-600/5 space-y-6">
              <div className="flex gap-6">
                <div className="w-14 h-14 rounded-2xl bg-sage-100 flex-shrink-0 flex items-center justify-center text-sage-600 font-black text-xl shadow-inner">
                  {isAnonymous ? '?' : (user?.displayName?.[0] || 'U')}
                </div>
                <div className="flex-grow space-y-4">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share something with the community..."
                    className="w-full bg-sage-50/50 border-none rounded-3xl p-6 text-sage-900 placeholder:text-sage-300 focus:ring-2 focus:ring-sage-600/10 resize-none min-h-[140px] text-lg font-serif italic"
                  />
                  <div className="flex flex-col gap-4 p-6 bg-sage-50/50 rounded-3xl border border-sage-100">
                    <p className="text-[10px] font-black text-sage-400 uppercase tracking-[0.2em] mb-2">
                      Please choose your posting preference: You can share your thoughts using your real name or remain completely anonymous.
                    </p>
                    <div className="flex items-center gap-6">
                      <span className="text-xs font-black text-sage-600 uppercase tracking-widest">Post as:</span>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setIsAnonymous(false)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            !isAnonymous ? "bg-sage-600 text-white" : "bg-white text-sage-400 border border-sage-100"
                          )}
                        >
                          {profile?.displayName || user?.displayName || 'Friend'}
                          {isAdmin && <span className="ml-1 opacity-70">(Admin)</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAnonymous(true)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            isAnonymous ? "bg-sage-600 text-white" : "bg-white text-sage-400 border border-sage-100"
                          )}
                        >
                          Post Anonymously
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newPost.trim()}
                  className="px-8 py-3 bg-sage-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-sage-700 transition-all disabled:opacity-50 flex items-center gap-3 shadow-lg shadow-sage-600/20"
                >
                  <Send className="w-4 h-4" />
                  Post
                </button>
              </div>
            </form>

            {/* Posts Feed */}
            <div className="space-y-8">
              {posts.filter(p => !p.deleted).map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 border border-sage-100 shadow-xl shadow-sage-600/5 space-y-8 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-sage-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-sage-600/20">
                        {post.authorName?.[0]}
                      </div>
                      <div>
                        <div className="font-serif text-xl font-bold text-sage-700">{post.authorName}</div>
                        <div className="text-[10px] text-stone-400 font-black uppercase tracking-[0.2em]">
                          {post.createdAt?.toDate()?.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {user?.uid === post.userId && (
                      <div className="relative group/menu">
                        <button className="text-stone-300 hover:text-sage-600 transition-colors p-2">
                          <MoreHorizontal className="w-6 h-6" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-2xl shadow-2xl border border-sage-50 hidden group-hover/menu:block z-10 overflow-hidden">
                          <button 
                            onClick={() => handleDeletePost(post.id)}
                            className="w-full px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            Delete Post
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-stone-600 leading-relaxed text-2xl font-serif italic">
                    "{post.content}"
                  </p>

                  <div className="flex items-center gap-8 pt-8 border-t border-sage-50">
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => handleLike(post.id, post.likes, post.dislikes)}
                        className={cn(
                          "flex items-center gap-3 transition-all group/btn",
                          post.likes?.includes(user?.uid) ? "text-rose-500" : "text-stone-400 hover:text-rose-500"
                        )}
                      >
                        <Heart className={cn("w-6 h-6 transition-transform group-active/btn:scale-125", post.likes?.includes(user?.uid) && "fill-rose-500")} />
                        <span className="text-sm font-black">{post.likes?.length || 0}</span>
                      </button>
                      <button 
                        onClick={() => handleDislike(post.id, post.likes, post.dislikes)}
                        className={cn(
                          "flex items-center gap-3 transition-all group/btn",
                          post.dislikes?.includes(user?.uid) ? "text-sage-700" : "text-stone-400 hover:text-sage-700"
                        )}
                      >
                        <Frown className={cn("w-6 h-6 transition-transform group-active/btn:scale-125", post.dislikes?.includes(user?.uid) && "fill-sage-700")} />
                        <span className="text-sm font-black">{post.dislikes?.length || 0}</span>
                      </button>
                    </div>
                    <button 
                      onClick={() => handleReply(post.id)}
                      className="flex items-center gap-3 text-stone-400 hover:text-sage-600 transition-colors group/btn"
                    >
                      <MessageCircle className="w-6 h-6 group-hover/btn:rotate-12 transition-transform" />
                      <span className="text-sm font-black uppercase tracking-widest">Reply</span>
                    </button>
                    <button 
                      onClick={() => handleShare(post)}
                      className="flex items-center gap-3 text-stone-400 hover:text-sage-600 transition-colors ml-auto group/btn"
                    >
                      <Share2 className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : activeTab === 'groups' ? (
          <motion.div
            key="groups"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="font-serif text-4xl font-bold text-sage-700">Problem Groups</h2>
                <p className="text-stone-400 text-xs font-black uppercase tracking-widest">Connect with people facing similar challenges</p>
              </div>
              <button 
                onClick={() => setShowAddProblem(true)}
                className="flex items-center gap-3 px-6 py-3 bg-sage-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-sage-700 transition-all shadow-lg shadow-sage-600/20"
              >
                <Plus className="w-4 h-4" />
                Add Problem
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {communities.map((community, i) => (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-sage-100 shadow-xl shadow-sage-600/5 flex flex-col gap-6 group hover:border-sage-600/20 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-sage-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                      {community.icon}
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-sage-700">{community.title}</h3>
                      <div className="text-[10px] text-stone-400 font-black uppercase tracking-widest">{community.members} members</div>
                    </div>
                  </div>
                  <p className="text-stone-500 italic font-serif leading-relaxed">{community.description}</p>
                  <button className="w-full py-4 bg-sage-50 text-sage-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-sage-600 hover:text-white transition-all border border-sage-100">
                    Join Community
                  </button>
                </motion.div>
              ))}
            </div>

            {showAddProblem && (
              <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-[3rem] p-12 max-w-xl w-full shadow-2xl space-y-8"
                >
                  <div className="space-y-4">
                    <h2 className="font-serif text-4xl font-bold text-sage-700">Add New Problem</h2>
                    <p className="text-stone-500 italic font-serif">Describe a challenge you're facing to start a new community group.</p>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Problem Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Social Anxiety at Work"
                        className="w-full px-6 py-4 bg-sage-50 border-none rounded-2xl focus:ring-2 focus:ring-sage-600/10"
                        value={newProblem.title}
                        onChange={(e) => setNewProblem({...newProblem, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Description</label>
                      <textarea 
                        placeholder="Tell us more about this challenge..."
                        className="w-full px-6 py-4 bg-sage-50 border-none rounded-2xl focus:ring-2 focus:ring-sage-600/10 min-h-[120px] resize-none"
                        value={newProblem.description}
                        onChange={(e) => setNewProblem({...newProblem, description: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowAddProblem(false)}
                      className="flex-grow py-4 bg-stone-100 text-stone-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-stone-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        if (newProblem.title && newProblem.description) {
                          setCommunities([...communities, { 
                            id: `c${Date.now()}`, 
                            title: newProblem.title, 
                            description: newProblem.description, 
                            members: 1, 
                            icon: "✨" 
                          }]);
                          setShowAddProblem(false);
                          setNewProblem({ title: '', description: '' });
                        }
                      }}
                      className="flex-grow py-4 bg-sage-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-sage-700 transition-all shadow-lg shadow-sage-600/20"
                    >
                      Create Group
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="mentors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="relative flex-grow">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-sage-300 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Search by specialty or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-16 pr-6 py-4 bg-white/80 backdrop-blur-xl border border-sage-100 rounded-3xl text-sage-900 placeholder:text-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-600/10 shadow-xl shadow-sage-600/5"
                />
              </div>
              <button className="flex items-center gap-3 px-8 py-4 bg-white/80 backdrop-blur-xl border border-sage-100 rounded-3xl text-sage-700 font-black uppercase tracking-widest hover:bg-sage-50 transition-all shadow-xl shadow-sage-600/5">
                <Filter className="w-5 h-5" />
                Filters
              </button>
            </div>

            {/* Mentor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredMentors.map((mentor, i) => (
                <motion.div
                  key={mentor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-sage-600/5 border border-sage-100 p-10 flex flex-col items-center text-center space-y-8 group cursor-pointer hover:border-sage-600/20 transition-all"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-sage-600 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity" />
                    <img
                      src={mentor.image || `https://picsum.photos/seed/${mentor.id}/200/200`}
                      alt={mentor.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-8 h-8 rounded-full border-4 border-white z-20 shadow-lg" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-serif text-3xl font-bold text-sage-700">{mentor.name}</h3>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-sage-600 font-black uppercase tracking-[0.3em]">
                      <ShieldCheck className="w-4 h-4" />
                      {mentor.role}
                    </div>
                    {mentor.location && (
                      <div className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">
                        {mentor.location}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {mentor.languages?.map((lang: string) => (
                      <span key={lang} className="px-3 py-1 bg-sage-50 rounded-full text-[9px] font-black text-sage-700 uppercase tracking-widest border border-sage-100">
                        {lang}
                      </span>
                    ))}
                    {!mentor.languages && (
                      <div className="px-6 py-2 bg-sage-50 rounded-full text-[10px] font-black text-sage-700 uppercase tracking-widest shadow-inner">
                        {mentor.specialty}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-amber-400">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="text-sm font-black text-sage-700">{mentor.rating || 5.0}</span>
                    <span className="text-xs text-stone-400 font-medium">({mentor.reviews || 0} reviews)</span>
                  </div>

                  <button className="w-full py-4 bg-sage-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-sage-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-sage-600/20 group/btn">
                    <MessageCircle className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                    Connect Now
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call to Action */}
      <section className="bg-sage-700 rounded-[4rem] p-16 flex flex-col lg:flex-row items-center justify-between gap-12 text-white relative overflow-hidden shadow-2xl shadow-sage-700/20">
        <Sparkles className="absolute -top-10 -right-10 w-64 h-64 text-white/5 rotate-12" />
        <div className="space-y-6 text-center lg:text-left relative z-10 max-w-xl">
          <h2 className="font-serif text-5xl font-bold leading-tight">Want to help others?</h2>
          <p className="text-white/70 text-xl italic font-serif">Join our volunteer program and become a peer mentor. Your experience can change someone's life.</p>
        </div>
        <button className="px-12 py-5 bg-white text-sage-700 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-sage-50 transition-all whitespace-nowrap relative z-10 shadow-2xl shadow-white/10 hover:scale-105 active:scale-95">
          Apply as Volunteer
        </button>
      </section>
    </div>
  );
}
