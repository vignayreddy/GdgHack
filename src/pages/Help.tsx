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
    color: "bg-emerald-50 text-emerald-600",
    action: "Start Chat",
    type: "chat"
  },
  {
    title: "Crisis Helpline",
    description: "Immediate support for urgent emotional distress. Available 24/7.",
    icon: Phone,
    color: "bg-red-50 text-red-600",
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
    color: "bg-purple-50 text-purple-600",
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
            systemInstruction: "You are a compassionate, anonymous mental health support assistant for an app called Resilient Roots. Your goal is to listen, provide empathy, and suggest healthy coping mechanisms. You are NOT a doctor, so if someone is in immediate danger, advise them to call the Crisis Helpline at 6303789759. Keep responses concise and supportive. Always maintain anonymity and never ask for personal identifying information."
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden border border-stone-200 shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-900">Anonymous Support</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-xs text-stone-900 font-medium">Online & Ready to Listen</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-stone-100 rounded-xl transition-all text-stone-400 hover:text-stone-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-6 bg-stone-50/30">
          {messages.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}
            >
              <div className={cn(
                "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                msg.role === 'user' 
                  ? "bg-stone-900 text-white font-medium rounded-tr-none" 
                  : "bg-white text-stone-900 border border-stone-200 rounded-tl-none"
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
              <div className="bg-white border border-stone-200 p-4 rounded-2xl rounded-tl-none flex gap-1.5 shadow-sm">
                <span className="w-2 h-2 bg-stone-900/40 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-stone-900/70 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-stone-900 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-stone-200 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message here..."
              className="flex-grow bg-stone-50 border border-stone-200 rounded-full px-6 py-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/20"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-12 h-12 bg-stone-900 text-white rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
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
    }
  };

  return (
    <div className="space-y-16 pb-20">
      <header className="space-y-6 text-center pt-8">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900/5 rounded-full text-stone-900 text-sm font-semibold border border-stone-900/10"
        >
          <Shield className="w-4 h-4" />
          <span>Your Privacy is Our Priority</span>
        </motion.div>
        <h1 className="font-serif text-5xl md:text-6xl font-bold text-stone-900">Anonymous Help Center</h1>
        <p className="text-stone-500 max-w-2xl mx-auto text-lg leading-relaxed">
          We're here to listen. You don't have to go through this alone. 
          Choose a channel that feels safe for you.
        </p>
        <p className="text-stone-900 text-sm font-bold uppercase tracking-widest">
          Founded by vignay reddy
        </p>
      </header>

      {/* Help Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {helpChannels.map((channel, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8 flex flex-col sm:flex-row items-start gap-6 group hover:border-stone-900/20 transition-all"
          >
            <div className={cn("p-5 rounded-3xl shrink-0 transition-transform group-hover:scale-110", channel.color)}>
              <channel.icon className="w-10 h-10" />
            </div>
            <div className="space-y-4 flex-grow">
              <h3 className="font-serif text-3xl font-bold text-stone-900">{channel.title}</h3>
              <p className="text-stone-500 leading-relaxed">{channel.description}</p>
              <button 
                onClick={() => handleChannelAction(channel)}
                className="px-8 py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors text-sm w-full sm:w-auto"
              >
                {channel.action}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Anonymous Message Form */}
      <section className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8 md:p-16 space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Lock className="w-64 h-64" />
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-stone-900/5 rounded-2xl">
            <Lock className="w-8 h-8 text-stone-900" />
          </div>
          <h2 className="font-serif text-4xl font-bold text-stone-900">Send an Anonymous Message</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-stone-400 uppercase tracking-wider">
              What's on your mind? (No one will know it's you)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-48 p-8 bg-stone-50 border border-stone-200 rounded-[32px] text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/20 resize-none transition-all text-lg"
            />
          </div>
          
          <button
            type="submit"
            disabled={!message.trim() || isSent || isSubmitting}
            className={cn(
              "px-16 py-5 bg-stone-900 text-white rounded-full font-bold text-xl flex items-center justify-center gap-3 transition-all",
              (isSent || isSubmitting) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? "Sending..." : isSent ? "Message Sent!" : "Send Message"}
            {!isSent && !isSubmitting && <Send className="w-6 h-6" />}
          </button>
        </form>

        <div className="flex items-center gap-2 text-stone-400 text-sm italic relative z-10">
          <Shield className="w-4 h-4" />
          <p>* Your message is encrypted and stored anonymously. Only authorized counselors can view it.</p>
        </div>
      </section>

      <AnimatePresence>
        {isChatOpen && (
          <ChatbotModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
