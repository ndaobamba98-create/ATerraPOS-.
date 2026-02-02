
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, User, Loader2 } from 'lucide-react';
import { getBusinessInsights } from '../services/geminiService';

interface Props {
  onClose: () => void;
  context: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIAssistant: React.FC<Props> = ({ onClose, context }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Bonjour ! Je suis votre assistant IA TerraPOS+. Je peux vous aider à analyser vos données, rédiger des courriels ou répondre à des questions spécifiques sur votre ERP. Comment puis-je vous aider aujourd'hui ?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const contextStr = JSON.stringify(context);
      const answer = await getBusinessInsights(contextStr, userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, j'ai rencontré une erreur. Veuillez réessayer." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-slate-900 shadow-2xl z-50 border-l border-slate-200 dark:border-slate-800 flex flex-col animate-slideInRight transition-colors duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-indigo-600 text-white">
        <div className="flex items-center">
          <div className="p-2 bg-white/10 rounded-lg mr-3"><Bot size={20} /></div>
          <div>
            <h3 className="font-bold text-sm">Assistant TerraPOS+</h3>
            <span className="text-[10px] text-indigo-200">Propulsé par Gemini AI</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none'
            }`}>
              <div className="flex items-center mb-1 text-[10px] opacity-70 font-bold uppercase tracking-wider">
                {m.role === 'user' ? <User size={10} className="mr-1" /> : <Sparkles size={10} className="mr-1" />}
                {m.role === 'user' ? 'Vous' : 'Assistant'}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <Loader2 className="animate-spin text-indigo-500" size={18} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
          <input
            type="text"
            placeholder="Posez votre question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1 dark:text-white"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-lg transition-colors ${
              input.trim() && !isLoading ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">L'IA peut faire des erreurs. Vérifiez les données importantes.</p>
      </div>
    </div>
  );
};

export default AIAssistant;
