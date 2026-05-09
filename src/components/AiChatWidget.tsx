import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import { analyzeText, evaluateCandidateByText } from '../services/gemini';
import { AnalysisResult } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AiChatWidgetProps {
  activeJobId: string | null;
  activeResult: AnalysisResult | null;
  activeJobJd: string;
  language: 'en' | 'zh';
}

const AiChatWidget: React.FC<AiChatWidgetProps> = ({
  activeJobId,
  activeResult,
  activeJobJd,
  language,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const systemGreeting = language === 'zh'
    ? "您好！我是 ST AI 招聘助手。您可以问我候选人匹配分析、简历风险评估或招聘建议。"
    : "Hi! I'm the ST AI Recruiting Assistant. Ask me about candidate fit, resume risks, or hiring advice.";

  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([{
        id: 'greeting',
        role: 'assistant',
        content: systemGreeting
      }]);
    }
  }, [language, systemGreeting]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setChatHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let response: string;
      if (activeResult) {
        response = await evaluateCandidateByText(activeJobJd, JSON.stringify(activeResult));
      } else {
        response = await analyzeText(`Context: job=${activeJobId}, lang=${language}. Question: ${input}`);
      }

      setChatHistory(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response
      }]);
    } catch (error) {
      setChatHistory(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: language === 'zh' ? "抱歉，我遇到了点问题，请稍后再试。" : "Sorry, I encountered an issue. Please try again later."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[380px] h-[520px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="bg-st-dark p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-st-yellow rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-st-dark" />
                </div>
                <div>
                  <h3 className="text-white font-black text-sm tracking-tight">ST AI Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-st-success rounded-full animate-pulse" />
                    <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 st-scrollbar bg-slate-50/50"
            >
              {chatHistory.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === 'assistant' ? 'bg-st-dark text-st-yellow' : 'bg-st-light text-white'
                  }`}>
                    {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm font-medium leading-relaxed ${
                    msg.role === 'assistant' 
                    ? 'bg-white border border-slate-200 text-slate-700 shadow-sm' 
                    : 'bg-st-dark text-white shadow-lg'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-st-dark text-st-yellow rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm">
                    <Loader2 className="w-4 h-4 text-st-dark animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="relative">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={language === 'zh' ? '输入问题...' : 'Ask a question...'}
                  className="w-full pl-6 pr-14 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-st-light/10 font-bold text-st-dark placeholder:text-slate-300 transition-all text-sm"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-st-dark text-st-yellow rounded-xl flex items-center justify-center shadow-lg disabled:opacity-50 disabled:grayscale hover:scale-105 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-st-dark text-st-yellow rounded-2xl shadow-2xl flex items-center justify-center group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-st-light/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <MessageSquare className="w-8 h-8 transition-transform group-hover:rotate-12" />
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-st-success border-2 border-white rounded-full" />
        )}
      </motion.button>
    </div>
  );
};

export default AiChatWidget;
