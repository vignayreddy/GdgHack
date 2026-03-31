import React from 'react';
import { motion } from 'motion/react';
import { 
  Phone, 
  Globe, 
  MessageCircle, 
  ShieldCheck, 
  ExternalLink, 
  Heart, 
  Users, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';

const NGOs = [
  {
    id: 1,
    name: "Youngistaan Foundation",
    about: "Youth-led NGO (founded 2014) working on education, poverty, youth empowerment & awareness programs. Also conducts mental health awareness sessions (not crisis support).",
    contact: ["+91 9100142224", "+91 9885342224"],
    website: "https://youngistaanfoundation.org",
    highlight: "Engages 50,000+ youth volunteers across India",
    color: "bg-blue-50 text-blue-600 border-blue-200",
    icon: Users
  },
  {
    id: 2,
    name: "Vandrevala Foundation",
    about: "One of India’s most trusted mental health NGOs. Provides free counselling & crisis intervention.",
    contact: ["+91 9999666555", "+91 1860 266 2345"],
    website: "https://vandrevalafoundation.com",
    highlight: "Offers 24/7 nationwide support in multiple languages",
    color: "bg-rose-50 text-rose-600 border-rose-200",
    icon: Heart
  },
  {
    id: 3,
    name: "Tele-MANAS",
    about: "Government of India mental health initiative designed especially for students & youth.",
    contact: ["14416", "1800-891-4416"],
    website: "https://telemanas.mohfw.gov.in",
    highlight: "Nationwide, multilingual mental health support system",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    icon: ShieldCheck
  },
  {
    id: 4,
    name: "Manas Foundation",
    about: "NGO working in mental health + social development. Focus on women, youth & community mental health.",
    contact: ["+91 11 41708517", "+91 98113 33566"],
    website: "https://manas.org.in",
    highlight: "Provides counselling and awareness programs",
    color: "bg-purple-50 text-purple-600 border-purple-200",
    icon: MessageCircle
  },
  {
    id: 5,
    name: "Parivarthan Counselling Helpline",
    about: "Professional counselling NGO focused on emotional support & therapy. Run by trained counsellors with confidential support.",
    contact: ["+91 7676602602", "+91 95133 30000"],
    website: "https://parivarthan.org",
    highlight: "Run by trained counsellors with confidential support",
    color: "bg-amber-50 text-amber-600 border-amber-200",
    icon: Sparkles
  }
];

export default function Resources() {
  return (
    <div className="space-y-16 pb-20 max-w-5xl mx-auto">
      <header className="space-y-6 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-sage-100 rounded-full text-[10px] font-black text-sage-600 uppercase tracking-[0.3em] shadow-sm mx-auto">
          <ShieldCheck className="w-4 h-4" />
          Trusted Support
        </div>
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-sage-700 tracking-tight">NGO Resources</h1>
        <p className="text-stone-500 max-w-2xl mx-auto text-xl italic font-serif leading-relaxed">
          "You are not alone. These organizations are here to support you."
        </p>
      </header>

      <div className="grid grid-cols-1 gap-10">
        {NGOs.map((ngo, i) => (
          <motion.div
            key={ngo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-12 border border-sage-100 shadow-xl shadow-sage-600/5 hover:shadow-2xl hover:border-sage-600/20 transition-all group"
          >
            <div className="flex flex-col md:flex-row gap-12">
              <div className="flex-shrink-0">
                <div className={cn("w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500", ngo.color)}>
                  <ngo.icon className="w-12 h-12" />
                </div>
              </div>
              
              <div className="flex-grow space-y-8">
                <div className="space-y-4">
                  <h2 className="font-serif text-4xl font-bold text-sage-700">{ngo.name}</h2>
                  <p className="text-stone-500 leading-relaxed text-xl italic font-serif">
                    {ngo.about}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">Contact Information</div>
                    {ngo.contact.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-4 text-sage-700 font-bold text-lg">
                        <Phone className="w-5 h-5 text-sage-400" />
                        {c}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">Official Website</div>
                    <a 
                      href={ngo.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 text-sage-700 font-bold text-lg hover:text-sage-600 transition-colors group/link"
                    >
                      <Globe className="w-5 h-5 text-sage-400" />
                      Visit Website
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                    </a>
                  </div>
                </div>

                <div className="pt-8 border-t border-sage-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-3 text-emerald-600 font-black text-sm uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full">
                    <Sparkles className="w-4 h-4" />
                    {ngo.highlight}
                  </div>
                  <button 
                    onClick={() => window.open(ngo.website, '_blank')}
                    className="flex items-center gap-3 text-sage-700 font-black text-sm uppercase tracking-widest hover:translate-x-3 transition-transform group/btn"
                  >
                    Learn More
                    <ArrowRight className="w-5 h-5 group-hover/btn:text-sage-400 transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FAQs Section */}
      <section className="space-y-12">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="font-serif text-4xl font-bold text-sage-700">Frequently Asked Questions</h2>
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.3em]">Common Queries & Support</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              q: "What is NyxWell?",
              a: "NyxWell is a community-driven platform dedicated to mental health awareness, peer support, and resource sharing. We provide tools like trackers, community forums, and access to professional resources to help you on your journey."
            },
            {
              q: "How can I get immediate help?",
              a: "If you are in a crisis, please call our 24/7 helpline at 6303789759 or the Tele-MANAS helpline at 14416. For life-threatening emergencies, dial 112."
            },
            {
              q: "Is my data private?",
              a: "Yes, we prioritize your privacy. Your personal information is encrypted, and you have the option to remain anonymous in our community and help sections."
            },
            {
              q: "How can I become a peer mentor?",
              a: "You can apply to be a volunteer through our 'Connect & Grow' section in the Community page. We look for individuals with lived experience who want to support others."
            },
            {
              q: "Who can access my mood logs?",
              a: "Your mood logs are private to you. Only if you explicitly share them with a counselor or mentor can they be viewed by others."
            },
            {
              q: "Are the resources free?",
              a: "Yes, all the NGO resources and helplines listed on NyxWell are free of cost for everyone."
            }
          ].map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-sage-100 shadow-xl shadow-sage-600/5 space-y-6 hover:border-sage-600/20 transition-all"
            >
              <h3 className="font-serif text-2xl font-bold text-sage-700">{faq.q}</h3>
              <p className="text-stone-500 text-lg italic font-serif leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Emergency Section */}
      <section className="bg-rose-900 rounded-[4rem] p-16 text-white relative overflow-hidden shadow-2xl shadow-rose-900/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 space-y-10 text-center md:text-left">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-sm border border-white/10">
            <AlertCircle className="w-4 h-4" />
            Emergency Support
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="space-y-4">
              <h2 className="font-serif text-5xl font-bold">In immediate danger?</h2>
              <p className="text-white/60 max-w-xl text-xl italic font-serif">If you are experiencing a life-threatening emergency, please contact our crisis helpline or local emergency services immediately.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
              <a href="tel:6303789759" className="px-10 py-5 bg-white text-rose-900 rounded-2xl font-black uppercase tracking-widest hover:bg-stone-100 transition-all text-center text-sm shadow-xl">
                Call 6303789759
              </a>
              <a href="tel:112" className="px-10 py-5 bg-rose-800 text-white border border-white/20 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-700 transition-all text-center text-sm shadow-xl">
                Call 112
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function AlertCircle({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
