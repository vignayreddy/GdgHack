import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Gamepad2, 
  Image as ImageIcon, 
  Video, 
  ExternalLink,
  Heart,
  Smile,
  Zap,
  Play
} from 'lucide-react';
import { cn } from '../lib/utils';

const externalActivities = [
  {
    id: 1,
    title: "Guided Meditation for Anxiety",
    type: "video",
    description: "A 10-minute session to help you find your center and calm your mind.",
    thumbnail: "https://picsum.photos/seed/meditation/800/450",
    link: "https://www.youtube.com/watch?v=O-6f5wQXSu8",
    category: "Mindfulness"
  },
  {
    id: 2,
    title: "Nature Sounds for Relaxation",
    type: "audio",
    description: "Immerse yourself in the soothing sounds of a forest rain.",
    thumbnail: "https://picsum.photos/seed/nature/800/450",
    link: "https://www.youtube.com/watch?v=eKFTSSKCzWA",
    category: "Relaxation"
  },
  {
    id: 3,
    title: "Daily Yoga for Beginners",
    type: "video",
    description: "Simple stretches and poses to improve flexibility and reduce stress.",
    thumbnail: "https://picsum.photos/seed/yoga/800/450",
    link: "https://www.youtube.com/watch?v=v7AYKMP6rOE",
    category: "Physical Health"
  }
];

const funnyGames = [
  {
    id: 1,
    title: "Bubble Wrap Pop",
    description: "The ultimate stress reliever. Just pop the bubbles!",
    icon: Zap,
    color: "bg-blue-50 text-blue-600 border-blue-200",
    link: "https://www.puffgames.com/bubblewrap/"
  },
  {
    id: 2,
    title: "Quick Draw",
    description: "Can an AI guess what you're drawing? Fun and creative!",
    icon: Smile,
    color: "bg-amber-50 text-amber-600 border-amber-200",
    link: "https://quickdraw.withgoogle.com/"
  },
  {
    id: 3,
    title: "2048",
    description: "A simple but addictive puzzle game to keep your mind engaged.",
    icon: Gamepad2,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    link: "https://play2048.co/"
  }
];

const musicRecommendations = [
  {
    id: 1,
    title: "Weightless",
    artist: "Marconi Union",
    description: "Scientifically proven to be the most relaxing song ever recorded.",
    youtube: "https://www.youtube.com/watch?v=UfcAVejsigU",
    moods: ['Stressed', 'Anxious']
  },
  {
    id: 2,
    title: "Clair de Lune",
    artist: "Claude Debussy",
    description: "A beautiful, calming piano piece that soothes the soul.",
    youtube: "https://www.youtube.com/watch?v=CvFH_6DNRCY",
    moods: ['Sad', 'Calm']
  },
  {
    id: 3,
    title: "River Flows in You",
    artist: "Yiruma",
    description: "Gentle piano melody perfect for reflection and peace.",
    youtube: "https://www.youtube.com/watch?v=7maJOI3QMu0",
    moods: ['Tired', 'Calm']
  },
  {
    id: 4,
    title: "Siva Sivaya",
    artist: "Traditional / Carnatic",
    description: "A meditative and spiritual chant that brings inner peace.",
    youtube: "https://www.youtube.com/watch?v=XvS_v2vM_G8",
    moods: ['Stressed', 'Anxious', 'Calm']
  },
  {
    id: 5,
    title: "Nuvvostanante",
    artist: "Devi Sri Prasad",
    description: "An uplifting and nostalgic Telugu track to boost your mood.",
    youtube: "https://www.youtube.com/watch?v=G_Y2_Y2_Y2_Y",
    moods: ['Sad', 'Tired']
  },
  {
    id: 6,
    title: "Butta Bomma",
    artist: "Armaan Malik",
    description: "A catchy and energetic Telugu song that will make you want to dance.",
    youtube: "https://www.youtube.com/watch?v=2m1RLfX8ZEU",
    moods: ['Tired', 'Sad']
  },
  {
    id: 7,
    title: "Samajavaragamana",
    artist: "Sid Sriram",
    description: "A soulful and melodic Telugu track that is perfect for relaxation.",
    youtube: "https://www.youtube.com/watch?v=oc_P1Z_G_Y",
    moods: ['Calm', 'Anxious']
  },
  {
    id: 8,
    title: "Inkem Inkem Inkem Kaavaale",
    artist: "Sid Sriram",
    description: "A beautiful romantic Telugu song that brings a smile to your face.",
    youtube: "https://www.youtube.com/watch?v=8S_G_Y2_Y2_Y",
    moods: ['Calm', 'Sad']
  }
];

export default function Activities() {
  const [mood, setMood] = React.useState('');
  const [recommendation, setRecommendation] = React.useState<any>(null);

  const getRecommendation = () => {
    const filtered = musicRecommendations.filter(m => m.moods.includes(mood));
    const random = filtered[Math.floor(Math.random() * filtered.length)] || musicRecommendations[0];
    setRecommendation(random);
  };
  return (
    <div className="space-y-16 pb-20 max-w-6xl mx-auto">
      <header className="space-y-6 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-sage-100 rounded-full text-[10px] font-black text-sage-600 uppercase tracking-[0.2em] shadow-sm">
          <Sparkles className="w-3 h-3" />
          Relax & Recharge
        </div>
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-sage-700 tracking-tight">External Activities</h1>
        <p className="text-stone-500 max-w-2xl mx-auto text-xl italic font-serif leading-relaxed">
          "Take a break, play a game, or immerse yourself in calming content. You deserve this moment of peace."
        </p>
      </header>

      {/* External Activities Section */}
      <section className="space-y-10">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="font-serif text-4xl font-bold text-sage-700">Curated Content</h2>
            <p className="text-stone-400 text-xs font-black uppercase tracking-widest">Videos & Resources</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {externalActivities.map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-sage-100 shadow-xl shadow-sage-600/5 hover:shadow-sage-600/10 transition-all group"
            >
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={activity.thumbnail} 
                  alt={activity.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-sage-900/20 group-hover:bg-sage-900/40 transition-colors flex items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-sage-700 fill-current ml-1" />
                  </div>
                </div>
                <div className="absolute top-6 left-6">
                  <span className="px-4 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-black text-sage-700 uppercase tracking-widest shadow-sm">
                    {activity.category}
                  </span>
                </div>
              </div>
              <div className="p-8 space-y-5">
                <h3 className="font-serif text-2xl font-bold text-sage-700">{activity.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed italic font-serif">
                  {activity.description}
                </p>
                <a 
                  href={activity.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-sage-600 font-black text-sm hover:translate-x-2 transition-transform group/link"
                >
                  Watch Now
                  <ExternalLink className="w-4 h-4 group-hover/link:rotate-12 transition-transform" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Funny Games Section */}
      <section className="space-y-10">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="font-serif text-4xl font-bold text-sage-700">Funny Games</h2>
            <p className="text-stone-400 text-xs font-black uppercase tracking-widest">Relax & Have Fun</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {funnyGames.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className={cn(
                "rounded-[3rem] p-10 border-2 transition-all hover:shadow-2xl group cursor-pointer",
                game.color.replace('border-blue-200', 'border-blue-100').replace('border-amber-200', 'border-amber-100').replace('border-emerald-200', 'border-emerald-100')
              )}
              onClick={() => window.open(game.link, '_blank')}
            >
              <div className="flex flex-col items-center text-center space-y-8">
                <div className="p-6 bg-white rounded-3xl shadow-xl shadow-black/5 group-hover:scale-110 transition-transform">
                  <game.icon className="w-10 h-10" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-serif text-3xl font-bold text-stone-900">{game.title}</h3>
                  <p className="text-stone-500 text-base italic font-serif leading-relaxed">
                    {game.description}
                  </p>
                </div>
                <div className="pt-6 border-t border-black/5 w-full flex items-center justify-center gap-3 font-black text-sm text-stone-900 uppercase tracking-widest">
                  Play Game
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Music Recommendation Section */}
      <section className="space-y-10">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="font-serif text-4xl font-bold text-sage-700">Music for the Soul</h2>
            <p className="text-stone-400 text-xs font-black uppercase tracking-widest">Personalized Recommendations</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-12 border border-sage-100 shadow-xl shadow-sage-600/5 space-y-10">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-grow space-y-6">
              <h3 className="font-serif text-3xl font-bold text-sage-700">How are you feeling right now?</h3>
              <div className="flex flex-wrap gap-4">
                {['Stressed', 'Anxious', 'Tired', 'Sad', 'Calm'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={cn(
                      "px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                      mood === m ? "bg-sage-600 text-white" : "bg-sage-50 text-sage-400 hover:bg-sage-100"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button 
                onClick={getRecommendation}
                disabled={!mood}
                className="px-10 py-4 bg-sage-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-sage-800 transition-all disabled:opacity-50 shadow-xl shadow-sage-700/20"
              >
                Get Song Recommendation
              </button>
            </div>
            {recommendation && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full md:w-80 bg-sage-50 rounded-[2.5rem] p-8 border border-sage-100 space-y-6"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Play className="w-8 h-8 text-sage-600 fill-current ml-1" />
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] font-black text-sage-400 uppercase tracking-widest">Recommended for you</div>
                  <h4 className="font-serif text-2xl font-bold text-sage-700">{recommendation.title}</h4>
                  <p className="text-stone-500 text-sm italic font-serif">{recommendation.artist}</p>
                </div>
                <p className="text-stone-400 text-xs leading-relaxed">{recommendation.description}</p>
                <button 
                  onClick={() => window.open(recommendation.youtube, '_blank')}
                  className="w-full py-4 bg-white text-sage-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-sage-100 transition-all border border-sage-100"
                >
                  Listen on YouTube
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Inspirational Quote */}
      <section className="bg-white/40 backdrop-blur-sm rounded-[3rem] p-16 text-center space-y-8 border border-sage-100 shadow-xl shadow-sage-600/5">
        <Heart className="w-14 h-14 text-rose-500 mx-auto fill-current opacity-20 animate-pulse" />
        <p className="text-sage-700 text-3xl font-serif italic leading-relaxed max-w-4xl mx-auto">
          "Sometimes the most productive thing you can do is relax and let your mind wander."
        </p>
        <div className="text-stone-400 text-xs font-black uppercase tracking-[0.3em]">— Mental Health Wisdom</div>
      </section>
    </div>
  );
}
