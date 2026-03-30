import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, MessageSquare, Phone, Mail, HelpCircle, Send, Lock, X, Bot, User as UserIcon } from 'lucide-react';
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

function ChatbotModal({ isOpen, onClose }) {
  console.log("ChatbotModal rendered, isOpen:", isOpen);
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hello. I'm your anonymous support assistant. How are you feeling today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize chat when modal opens
  useEffect(() => {
    if (isOpen && !chatRef.current) {
      const apiKey = process.env.GEMINI_API_KEY;
      console.log("Initializing chat with API key:", apiKey ? "Present" : "Missing");
      
      if (!apiKey) {
        console.error("GEMINI_API_KEY is missing. Please set it in the environment variables.");
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
        console.log("Chat session created successfully");
      } catch (err) {
        console.error("Failed to initialize Gemini AI:", err);
        setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble starting up. Please try again later." }]);
      }
    }
    if (!isOpen) {
      console.log("Closing chat, clearing session");
      chatRef.current = null;
      setMessages([{ role: 'model', text: "Hello. I'm your anonymous support assistant. How are you feeling today?" }]);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || !chatRef.current) {
      console.log("Cannot send message:", { input: !!input.trim(), isTyping, hasChat: !!chatRef.current });
      return;
    }

    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    console.log("Sending message to Gemini:", currentInput);

    try {
      const response = await chatRef.current.sendMessage({ message: currentInput });
      console.log("Received response from Gemini:", response);
      const botText = response.text || "I'm here to listen, but I couldn't generate a response right now. Please tell me more.";
      const botResponse = { role: 'model', text: botText };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error("Chatbot error:", error);
      let errorMessage = "I'm sorry, I'm having trouble connecting right now. Please try again or use our other support channels.";
      
      if (error instanceof Error && error.message.includes("API key")) {
        errorMessage = "There's an issue with my API configuration. Please contact support.";
      }
      
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
        className="card w-full max-w-2xl h-[600px] flex flex-col overflow-hidden border-brand-primary/20 shadow-2xl shadow-brand-primary/10"
      >
        {/* Header */}
        <div className="p-6 border-b border-brand-border flex items-center justify-between bg-brand-surface">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-primary/20 rounded-2xl flex items-center justify-center">
              <Bot className="w-7 h-7 text-brand-primary" />
            </div>
            <div>
              <h3 className="serif text-xl font-bold text-brand-text">Anonymous Support</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-xs text-brand-primary font-medium">Online & Ready to Listen</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-brand-border rounded-xl transition-all text-brand-muted hover:text-brand-text"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-6 bg-brand-bg/30">
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
                  ? "bg-brand-primary text-white font-medium rounded-tr-none" 
                  : "bg-white text-brand-text border border-brand-border rounded-tl-none"
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
              <div className="bg-white border border-brand-border p-4 rounded-2xl rounded-tl-none flex gap-1.5 shadow-sm">
                <span className="w-2 h-2 bg-brand-primary/40 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-brand-primary/70 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-brand-primary rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-brand-border bg-brand-surface">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message here..."
              className="flex-grow bg-brand-bg border border-brand-border rounded-full px-6 py-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-12 h-12 bg-brand-primary text-brand-bg rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-all"
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const helpRequestData = {
        message: message.trim(),
        status: 'pending',
        timestamp: serverTimestamp()
      };
      
      // Only attach UID if user is logged in, otherwise keep it truly anonymous
      if (user?.uid) {
        helpRequestData.uid = user.uid;
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

  const handleChannelAction = (channel) => {
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full text-brand-primary text-sm font-semibold border border-brand-primary/20"
        >
          <Shield className="w-4 h-4" />
          <span>Your Privacy is Our Priority</span>
        </motion.div>
        <h1 className="serif text-5xl md:text-6xl font-bold text-brand-text">Anonymous Help Center</h1>
        <p className="text-brand-muted max-w-2xl mx-auto text-lg leading-relaxed">
          We're here to listen. You don't have to go through this alone. 
          Choose a channel that feels safe for you.
        </p>
        <p className="text-brand-primary text-sm font-bold uppercase tracking-widest">
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
            className="card p-8 flex flex-col sm:flex-row items-start gap-6 group hover:border-brand-primary/50 transition-all"
          >
            <div className={cn("p-5 rounded-3xl shrink-0 transition-transform group-hover:scale-110", channel.color)}>
              <channel.icon className="w-10 h-10" />
            </div>
            <div className="space-y-4 flex-grow">
              <h3 className="serif text-3xl font-bold text-brand-text">{channel.title}</h3>
              <p className="text-brand-muted leading-relaxed">{channel.description}</p>
              <button 
                onClick={() => handleChannelAction(channel)}
                className="btn-secondary text-sm px-8 py-3 w-full sm:w-auto"
              >
                {channel.action}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Anonymous Message Form */}
      <section className="card p-8 md:p-16 space-y-10 bg-brand-surface border-brand-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Lock className="w-64 h-64" />
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-brand-primary/20 rounded-2xl">
            <Lock className="w-8 h-8 text-brand-primary" />
          </div>
          <h2 className="serif text-4xl font-bold text-brand-text">Send an Anonymous Message</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-brand-muted uppercase tracking-wider">
              What's on your mind? (No one will know it's you)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-48 p-8 bg-brand-bg border border-brand-border rounded-[32px] text-brand-text placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 resize-none transition-all text-lg"
            />
          </div>
          
          <button
            type="submit"
            disabled={!message.trim() || isSent || isSubmitting}
            className={cn(
              "btn-primary w-full md:w-auto px-16 py-5 text-xl flex items-center justify-center gap-3",
              (isSent || isSubmitting) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? "Sending..." : isSent ? "Message Sent!" : "Send Message"}
            {!isSent && !isSubmitting && <Send className="w-6 h-6" />}
          </button>
        </form>

        <div className="flex items-center gap-2 text-brand-muted text-sm italic relative z-10">
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
