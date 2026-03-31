import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, Users, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const features = [
  {
    title: "Safe Spaces",
    description: "A trusted, stigma-free environment to express emotional concerns without fear of judgment.",
    icon: Shield,
    color: "bg-blue-50 text-blue-600"
  },
  {
    title: "Peer Support",
    description: "Volunteer-led, community-rooted mentorship networks for adolescents.",
    icon: Users,
    color: "bg-green-50 text-green-600"
  },
  {
    title: "Anonymous Help",
    description: "Safe entry points for youth to reach out without revealing their identity.",
    icon: Heart,
    color: "bg-red-50 text-red-600"
  },
  {
    title: "Early Intervention",
    description: "Tools to detect and respond to early warning signs in adolescents.",
    icon: Sparkles,
    color: "bg-purple-50 text-purple-600"
  }
];

export default function Landing() {
  return (
    <div className="space-y-32 pb-20">
      {/* Hero Section */}
      <section className="text-center space-y-10 pt-16 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-sage-100 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-50 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sage-600/10 rounded-full text-sage-700 text-sm font-bold border border-sage-600/20 shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>Empowering Youth Emotional Wellbeing</span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          className="font-serif text-6xl md:text-8xl font-bold tracking-tight text-sage-700 max-w-5xl mx-auto leading-[0.95]"
        >
          Your Mental Health <br />
          <span className="italic text-sage-600/40">Matters More</span> Than You Know.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-xl text-stone-500 max-w-2xl mx-auto leading-relaxed font-medium"
        >
          Resilient Roots is a safe, stigma-free digital platform designed for adolescents to find support, 
          connect with peers, and access resources for emotional wellbeing.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-5"
        >
          <Link to="/dashboard" className="px-10 py-5 bg-sage-600 text-white rounded-full font-bold text-lg hover:bg-sage-700 transition-all flex items-center gap-2 shadow-xl shadow-sage-600/20 hover:-translate-y-1">
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/help" className="px-10 py-5 bg-white border-2 border-sage-100 text-sage-700 rounded-full font-bold text-lg hover:bg-sage-50 transition-all shadow-sm hover:-translate-y-1">
            I Need Help Now
          </Link>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { label: "Conditions begin before age 14", value: "50%" },
          { label: "Youth receive no care in low-income settings", value: "90%" },
          { label: "Adolescents experience mental health conditions", value: "1 in 7" }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="bg-white rounded-[2.5rem] shadow-xl shadow-stone-200/40 border border-sage-50 p-10 text-center card-hover"
          >
            <div className="font-serif text-5xl font-bold text-sage-700 mb-3">{stat.value}</div>
            <div className="text-stone-400 text-xs font-bold uppercase tracking-widest">{stat.label}</div>
          </motion.div>
        ))}
      </section>

      {/* Features Section */}
      <section className="space-y-16">
        <div className="text-center space-y-4">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-sage-700">What are we solving?</h2>
          <p className="text-stone-500 max-w-2xl mx-auto text-lg font-medium">
            We're building a world where asking for help is strength, not fear.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="bg-white rounded-[2rem] shadow-lg shadow-stone-200/30 border border-sage-50 p-8 space-y-6 card-hover"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-sage-50 text-sage-600 shadow-inner")}>
                <feature.icon className="w-7 h-7" />
              </div>
              <div className="space-y-3">
                <h3 className="font-serif text-2xl font-bold text-sage-700">{feature.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-sage-600 rounded-[3rem] p-16 md:p-24 text-center text-white space-y-10 shadow-2xl shadow-sage-600/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl" />
        
        <h2 className="font-serif text-5xl md:text-6xl font-bold max-w-4xl mx-auto leading-tight">
          Ready to take the first step towards a healthier mind?
        </h2>
        <p className="text-white/80 text-xl max-w-2xl mx-auto font-medium">
          Join our community today and discover a world of support and understanding.
        </p>
        <Link to="/signup" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-sage-700 rounded-full font-bold text-xl hover:bg-sage-50 transition-all shadow-xl hover:-translate-y-1">
          Join Resilient Roots
          <ArrowRight className="w-6 h-6" />
        </Link>
      </section>
    </div>
  );
}
