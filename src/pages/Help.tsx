import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, MessageSquare, Phone, Mail, HelpCircle, Send, Lock, X, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { GoogleGenAI } from "@google/genai";

const helpChannels = [
  {
    title: "Anonymous Chat",
    description: "Connect with a trained counselor instantly without revealing your identity.",
    icon: MessageSquare,
    color: "bg-sage-50 text-sage-600",
    action: "Start Chat",
    type: "chat"
  },
  {
    title: "Crisis Helpline",
    description: "Immediate support for urgent emotional distress. Available 24/7.",
    icon: Phone,
    color: "bg-rose-50 text-rose-600",
    action: "Call Now",
    value: "6303789759",
    type: "phone"
  },
  {
    title: "Email Support",
    description: "Write to us about your concerns and get a response within 24 hours.",
    icon: Mail,
    color: "bg-blue-50 text-blue-600",
    action: "Send Email",
    value: "vignayreddymuduganti@gmail.com",
    type: "email"
  },
  {
    title: "FAQ & Resources",
    description: "Find answers to common questions and helpful self-care guides.",
    icon: HelpCircle,
    color: "bg-amber-50 text-amber-600",
    action: "View FAQs",
    type: "link"
  }
];

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ChatbotModal({ isOpen, onClose }: ChatbotModalProps) {
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hello. I'm your anonymous support assistant. How are you feeling today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !chatRef.current) {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I'm not configured correctly yet. Please make sure the Gemini API key is set." }]);
        return;
      }

      try {
        const ai = new GoogleGenAI({ apiKey });
        chatRef.current = ai.chats.create({
          model: "gemini-3-flash-preview",
          config: {
            systemInstruction: "You are a compassionate, anonymous mental health support assistant for an app called NyxWell. Your goal is to listen, provide empathy, and suggest healthy coping mechanisms. You are NOT a doctor, so if someone is in immediate danger, advise them to call the Crisis Helpline at 6303789759. Keep responses concise and supportive. Always maintain anonymity and never ask for personal identifying information."
          }
        });
      } catch (err) {
        console.error("Failed to initialize Gemini AI:", err);
        setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble starting up. Please try again later." }]);
      }
    }
    if (!isOpen) {
      chatRef.current = null;
      setMessages([{ role: 'model', text: "Hello. I'm your anonymous support assistant. How are you feeling today?" }]);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || !chatRef.current) return;

    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatRef.current.sendMessage({ message: currentInput });
      const botText = response.text || "I'm here to listen, but I couldn't generate a response right now. Please tell me more.";
      const botResponse = { role: 'model', text: botText };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error("Chatbot error:", error);
      let errorMessage = "I'm sorry, I'm having trouble connecting right now. Please try again or use our other support channels.";
      setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sage-900/20 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white/90 backdrop-blur-2xl rounded-[3rem] w-full max-w-2xl h-[700px] flex flex-col overflow-hidden border border-sage-100 shadow-2xl shadow-sage-900/20"
      >
        {/* Header */}
        <div className="p-8 border-b border-sage-50 flex items-center justify-between bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-sage-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sage-600/20">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-bold text-sage-700">Anonymous Support</h3>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">Online & Ready to Listen</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-sage-50 rounded-2xl transition-all text-stone-400 hover:text-sage-700 group"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-grow overflow-y-auto p-8 space-y-8 bg-sage-50/20">
          {messages.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}
            >
              <div className={cn(
                "max-w-[85%] p-6 rounded-[2rem] text-lg leading-relaxed shadow-xl shadow-black/5 font-serif italic",
                msg.role === 'user' 
                  ? "bg-sage-600 text-white rounded-tr-none" 
                  : "bg-white text-sage-900 border border-sage-50 rounded-tl-none"
              )}>
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-sage-50 p-6 rounded-[2rem] rounded-tl-none flex gap-2 shadow-xl shadow-black/5">
                <span className="w-2.5 h-2.5 bg-sage-600/40 rounded-full animate-bounce" />
                <span className="w-2.5 h-2.5 bg-sage-600/70 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2.5 h-2.5 bg-sage-600 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="p-6 border-t border-sage-50 bg-white/50 backdrop-blur-sm">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message here..."
              className="flex-grow bg-sage-50/50 border border-sage-100 rounded-[2rem] px-8 py-4 text-lg text-sage-900 placeholder:text-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-600/10 font-serif italic shadow-inner"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-16 h-16 bg-sage-600 text-white rounded-[2rem] flex items-center justify-center hover:bg-sage-700 disabled:opacity-50 transition-all shadow-lg shadow-sage-600/20 group/btn"
            >
              <Send className="w-6 h-6 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function FAQModal({ isOpen, onClose }: FAQModalProps) {
  const faqs = [
    {
      q: "Is my identity really anonymous?",
      a: "Yes. We do not store your IP address, device ID, or any personal information when you use the Anonymous Help Center or Community Feed (if you choose to post anonymously)."
    },
    {
      q: "What happens after I send an anonymous message?",
      a: "Your message is encrypted and sent to our team of trained counselors. They will review it and, if necessary, provide a response that you can view in your notifications (if logged in) or via a unique session ID."
    },
    {
      q: "How does the AI mood analysis work?",
      a: "Our AI uses Google Gemini to analyze the emotional tone of your speech or facial expressions. This data is processed in real-time and is NOT stored on our servers after the analysis is complete."
    },
    {
      q: "Can I speak to a real person?",
      a: "Absolutely. You can use the 'Crisis Helpline' for immediate voice support or 'Email Support' to start a conversation with a human counselor."
    },
    {
      q: "What should I do in an emergency?",
      a: "If you are in immediate danger or having thoughts of self-harm, please call the Crisis Helpline immediately at 6303789759 or contact your local emergency services."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sage-900/20 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white/90 backdrop-blur-2xl rounded-[3rem] w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-sage-100 shadow-2xl shadow-sage-900/20"
      >
        <div className="p-8 border-b border-sage-50 flex items-center justify-between bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-sage-700">Frequently Asked Questions</h3>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-sage-50 rounded-2xl transition-all text-stone-400 hover:text-sage-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-8 space-y-6 bg-sage-50/20">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-sage-50 shadow-sm">
              <h4 className="font-bold text-sage-700 mb-2 text-lg">{faq.q}</h4>
              <p className="text-stone-500 leading-relaxed italic font-serif">{faq.a}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Help() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const helpRequestData: any = {
        message: message.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      };
      
      if (user?.uid) {
        helpRequestData.userId = user.uid;
      }

      await addDoc(collection(db, 'help_requests'), helpRequestData);
      setIsSent(true);
      setMessage('');
      setTimeout(() => setIsSent(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'help_requests');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChannelAction = (channel: any) => {
    if (channel.type === 'chat') {
      setIsChatOpen(true);
    } else if (channel.type === 'phone') {
      window.location.href = `tel:${channel.value}`;
    } else if (channel.type === 'email') {
      window.location.href = `mailto:${channel.value}`;
    } else if (channel.type === 'link') {
      setIsFAQOpen(true);
    }
  };

  return (
    <div className="space-y-16 pb-20 max-w-6xl mx-auto">
      <header className="space-y-8 text-center pt-12">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 px-6 py-2 bg-sage-100 rounded-full text-sage-600 text-[10px] font-black uppercase tracking-[0.3em] border border-sage-200 shadow-sm"
        >
          <Shield className="w-4 h-4" />
          <span>Your Privacy is Our Priority</span>
        </motion.div>
        <h1 className="font-serif text-5xl md:text-8xl font-bold text-sage-700 tracking-tight">Anonymous Help Center</h1>
        <p className="text-stone-500 max-w-3xl mx-auto text-2xl italic font-serif leading-relaxed">
          "We're here to listen. You don't have to go through this alone. 
          Choose a channel that feels safe for you."
        </p>
        <div className="inline-block px-6 py-2 bg-sage-50 rounded-xl border border-sage-100">
          <p className="text-sage-600 text-[10px] font-black uppercase tracking-[0.4em]">
            Founded by vignay reddy
          </p>
        </div>
      </header>

      {/* Help Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {helpChannels.map((channel, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-xl shadow-sage-600/5 border border-sage-100 p-10 flex flex-col sm:flex-row items-start gap-8 group hover:border-sage-600/20 transition-all"
          >
            <div className={cn("p-6 rounded-[2rem] shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg", channel.color)}>
              <channel.icon className="w-12 h-12" />
            </div>
            <div className="space-y-6 flex-grow">
              <h3 className="font-serif text-4xl font-bold text-sage-700">{channel.title}</h3>
              <p className="text-stone-500 leading-relaxed text-lg italic font-serif">{channel.description}</p>
              <button 
                onClick={() => handleChannelAction(channel)}
                className="px-10 py-4 bg-sage-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-sage-700 transition-all text-sm w-full sm:w-auto shadow-lg shadow-sage-600/20"
              >
                {channel.action}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Peer Mentors Section */}
      <section className="space-y-12">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="font-serif text-4xl font-bold text-sage-700">Peer Mentors</h2>
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.3em]">Connect with people who understand</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Srinivas Rao",
              role: "Senior Peer Mentor",
              bio: "Telugu-speaking mentor with 5 years of experience in youth counseling. Specializes in academic stress and career guidance.",
              image: "https://picsum.photos/seed/srinivas/200/200"
            },
            {
              name: "Lakshmi Devi",
              role: "Community Support Lead",
              bio: "Passionate about women's mental health and community building. Fluent in Telugu and English.",
              image: "https://picsum.photos/seed/lakshmi/200/200"
            },
            {
              name: "Vignesh Reddy",
              role: "Youth Advocate",
              bio: "Focuses on peer-to-peer support for university students. Expert in stress management techniques.",
              image: "https://picsum.photos/seed/vignesh/200/200"
            }
          ].map((mentor, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-8 border border-sage-100 shadow-xl shadow-sage-600/5 hover:shadow-2xl transition-all group text-center"
            >
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-6 border-4 border-sage-50 shadow-lg group-hover:scale-110 transition-transform">
                <img src={mentor.image} alt={mentor.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-sage-700">{mentor.name}</h3>
              <p className="text-sage-600 text-[10px] font-black uppercase tracking-widest mb-4">{mentor.role}</p>
              <p className="text-stone-500 text-sm italic font-serif leading-relaxed">{mentor.bio}</p>
              <button className="mt-6 px-6 py-2 bg-sage-50 text-sage-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-sage-600 hover:text-white transition-all">
                Connect
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Anonymous Message Form */}
      <section className="bg-white/80 backdrop-blur-xl rounded-[4rem] shadow-2xl shadow-sage-600/5 border border-sage-100 p-10 md:p-20 space-y-12 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 p-12 opacity-[0.03] pointer-events-none rotate-12">
          <Lock className="w-96 h-96" />
        </div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-5 bg-sage-100 rounded-3xl shadow-inner">
            <Lock className="w-10 h-10 text-sage-600" />
          </div>
          <h2 className="font-serif text-5xl font-bold text-sage-700">Send an Anonymous Message</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] ml-4">
              What's on your mind? (No one will know it's you)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-64 p-10 bg-sage-50/50 border border-sage-100 rounded-[3rem] text-sage-900 placeholder:text-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-600/10 resize-none transition-all text-2xl font-serif italic shadow-inner"
            />
          </div>
          
          <button
            type="submit"
            disabled={!message.trim() || isSent || isSubmitting}
            className={cn(
              "px-20 py-6 bg-sage-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xl flex items-center justify-center gap-4 transition-all shadow-2xl shadow-sage-600/20 hover:scale-105 active:scale-95",
              (isSent || isSubmitting) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? "Sending..." : isSent ? "Message Sent!" : "Send Message"}
            {!isSent && !isSubmitting && <Send className="w-7 h-7" />}
          </button>
        </form>

        <div className="flex items-center gap-3 text-stone-400 text-sm italic font-serif relative z-10 px-4">
          <Shield className="w-5 h-5 text-sage-400" />
          <p>* Your message is encrypted and stored anonymously. Only authorized counselors can view it.</p>
        </div>
      </section>

      <AnimatePresence>
        {isChatOpen && (
          <ChatbotModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        )}
        {isFAQOpen && (
          <FAQModal isOpen={isFAQOpen} onClose={() => setIsFAQOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
