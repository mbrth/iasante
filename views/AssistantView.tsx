
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { createAssistantChat } from '../services/geminiService';

// Composant utilitaire pour formater proprement le texte de l'IA
const FormattedMessage: React.FC<{ text: string; role: 'user' | 'ai' }> = ({ text, role }) => {
  if (role === 'user') return <p className="font-medium">{text}</p>;

  // Parsing très basique pour les listes et le gras (Markdown-like)
  const paragraphs = text.split('\n\n');

  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => {
        // Détection des listes à puces
        if (p.includes('\n-') || p.includes('\n*') || p.startsWith('-') || p.startsWith('*')) {
          const items = p.split('\n').filter(item => item.trim() !== '');
          return (
            <ul key={i} className="space-y-2 my-2">
              {items.map((item, j) => {
                const cleanItem = item.replace(/^[-*]\s*/, '');
                return (
                  <li key={j} className="flex gap-3 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <span className="text-slate-700 leading-relaxed font-medium">
                      {formatBoldText(cleanItem)}
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={i} className="text-slate-700 leading-relaxed font-medium">
            {formatBoldText(p)}
          </p>
        );
      })}
    </div>
  );
};

// Utilitaire pour gérer le gras type **texte**
const formatBoldText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-black text-emerald-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export const AssistantView: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: `Bonjour. J'ai analysé votre profil de **${profile.pathologies.join(', ')}**. \n\nVoici comment je peux vous aider aujourd'hui :\n- Optimiser votre glycémie pour le prochain repas\n- Analyser un aliment spécifique\n- Ajuster votre protocole hebdomadaire\n\nQue souhaitez-vous explorer ?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current = createAssistantChat(profile);
  }, [profile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userText });
      const aiText = response.text || "La connexion a été interrompue. Veuillez réessayer.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "**Alerte Système** : Le moteur médical est temporairement indisponible. Veuillez vous référer à votre protocole papier ou contacter votre médecin si nécessaire." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-14rem)] flex flex-col bg-[#F8FAFC] rounded-[3.5rem] shadow-2xl shadow-emerald-900/5 border border-white overflow-hidden relative">
      
      {/* Dynamic Header */}
      <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 rotate-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-2xl tracking-tight leading-none">NutriPath Intelligence</h3>
            <div className="flex items-center gap-2 mt-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em]">Medical-Grade Assistant Active</p>
            </div>
          </div>
        </div>
        <button className="p-4 hover:bg-slate-50 rounded-2xl transition text-slate-400">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
        </button>
      </div>

      {/* Chat Canvas */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            {m.role === 'ai' && (
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mr-4 mt-1 shrink-0 border border-emerald-200 shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
            )}
            <div className={`max-w-[85%] px-10 py-7 rounded-[2.5rem] shadow-sm transition-all duration-300 ${
              m.role === 'user' 
                ? 'bg-[#0F172A] text-white rounded-br-none shadow-xl shadow-slate-900/10' 
                : 'bg-white text-slate-800 rounded-bl-none border border-slate-100 hover:border-emerald-100'
            }`}>
              <FormattedMessage text={m.text} role={m.role} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 mr-4 shrink-0 border border-emerald-200 animate-pulse" />
            <div className="bg-white px-8 py-5 rounded-[2.5rem] rounded-bl-none border border-slate-100 flex gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Console */}
      <div className="p-8 bg-white/50 backdrop-blur-md border-t border-slate-100">
        <div className="max-w-4xl mx-auto flex gap-6 items-center bg-white p-2 rounded-[2.5rem] shadow-xl border border-slate-100 focus-within:border-emerald-500 focus-within:shadow-emerald-900/5 transition-all duration-500">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Posez une question sur votre glycémie, un aliment..."
            className="flex-1 px-8 py-4 bg-transparent text-lg font-semibold text-slate-700 placeholder:text-slate-300 outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-[#0F172A] text-white p-5 rounded-[2rem] hover:bg-emerald-600 transition-all disabled:opacity-30 shadow-2xl active:scale-95 transform flex items-center justify-center group"
          >
            <svg className="w-7 h-7 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9-2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-6">
           NutriPath AI ne remplace pas une consultation médicale d'urgence.
        </p>
      </div>
    </div>
  );
};
