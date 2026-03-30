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
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="text-center space-y-8 pt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full text-brand-primary text-sm font-semibold border border-brand-primary/20"
        >
          <Sparkles className="w-4 h-4" />
          <span>Empowering Youth Emotional Wellbeing</span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="serif text-5xl md:text-7xl font-bold tracking-tight text-brand-text max-w-4xl mx-auto leading-tight"
        >
          Your Mental Health <br />
          <span className="italic text-brand-primary">Matters More</span> Than You Know.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg text-brand-muted max-w-2xl mx-auto"
        >
          Resilient Roots is a safe, stigma-free digital platform designed for adolescents to find support, 
          connect with peers, and access resources for emotional wellbeing.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Link to="/dashboard" className="btn-primary flex items-center gap-2 text-lg px-8">
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/help" className="btn-secondary text-lg px-8">
            I Need Help Now
          </Link>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: "Conditions begin before age 14", value: "50%" },
          { label: "Youth receive no care in low-income settings", value: "90%" },
          { label: "Adolescents experience mental health conditions", value: "1 in 7" }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="card p-8 text-center"
          >
            <div className="serif text-4xl font-bold text-brand-primary mb-2">{stat.value}</div>
            <div className="text-brand-muted text-sm">{stat.label}</div>
          </motion.div>
        ))}
      </section>

      {/* Features Section */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="serif text-3xl md:text-4xl font-bold text-brand-text">What are we solving?</h2>
          <p className="text-brand-muted max-w-2xl mx-auto">
            We're building a world where asking for help is strength, not fear.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card p-6 space-y-4 hover:border-brand-primary/50 transition-all"
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-brand-primary/10 text-brand-primary")}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="serif text-xl font-bold text-brand-text">{feature.title}</h3>
              <p className="text-brand-muted text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-brand-primary rounded-[40px] p-12 md:p-20 text-center text-white space-y-8">
        <h2 className="serif text-4xl md:text-5xl font-bold max-w-3xl mx-auto">
          Ready to take the first step towards a healthier mind?
        </h2>
        <p className="opacity-80 text-lg max-w-xl mx-auto">
          Join our community today and discover a world of support and understanding.
        </p>
        <Link to="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-primary rounded-full font-bold text-lg hover:opacity-90 transition-all">
          Join Resilient Roots
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}
