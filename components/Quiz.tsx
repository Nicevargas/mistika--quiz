'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Sparkles, Lock, Zap, Heart, User, MessageCircle, X } from 'lucide-react';

import Image from 'next/image';
import { getSupabase } from '@/lib/supabase';

const questions = [
  {
    id: 1,
    question: "Como é sua presença digital hoje?",
    options: [
      { text: "Livro aberto: posto tudo o que sinto e faço.", weight: 1 },
      { text: "Moderada: posto fotos bonitas, mas evito polêmicas.", weight: 2 },
      { text: "Enigmática: perfil fechado e posts estratégicos.", weight: 3 },
    ],
  },
  {
    id: 2,
    question: "O que você faz quando ele visualiza e não responde?",
    options: [
      { text: "Mando outra mensagem perguntando se aconteceu algo.", weight: 1 },
      { text: "Fico ansiosa olhando o 'visto por último' o dia todo.", weight: 2 },
      { text: "Aplico o Chá de Sumiço e foco 100% em mim.", weight: 3 },
    ],
  },
  {
    id: 3,
    question: "Ao se olhar no espelho, quem você vê?",
    options: [
      { text: "Alguém que precisa de validação constante.", weight: 1 },
      { text: "Uma mulher bonita, mas cheia de inseguranças.", weight: 2 },
      { text: "Uma obra de arte em constante aperfeiçoamento.", weight: 3 },
    ],
  },
  {
    id: 4,
    question: "Você conhece os gatilhos mentais dele?",
    options: [
      { text: "Não acredito em jogos, o amor deve ser natural.", weight: 1 },
      { text: "Já ouvi falar, mas não sei como aplicar.", weight: 2 },
      { text: "Domino o 'Dar e Tomar' e o imaginativo dele.", weight: 3 },
    ],
  },
  {
    id: 5,
    question: "Qual é a sua faixa etária?",
    options: [
      { text: "18 a 25 anos", weight: 0 },
      { text: "26 a 35 anos", weight: 0 },
      { text: "36 a 45 anos", weight: 0 },
      { text: "46 anos ou mais", weight: 0 },
    ],
  },
  {
    id: 6,
    question: "Qual é o seu status de relacionamento atual?",
    options: [
      { text: "Solteira (em busca de um novo amor)", weight: 0 },
      { text: "Ficando (querendo algo sério)", weight: 0 },
      { text: "Namorando/Casada (esfriou a relação)", weight: 0 },
      { text: "Recém-terminada (querendo o ex de volta)", weight: 0 },
    ],
  },
];

export default function Quiz() {
  const [step, setStep] = useState(0); // 0: Intro, 1-6: Questions, 7: Calculating, 8: Result
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [isContactSaved, setIsContactSaved] = useState(false);

  const handleStart = () => setStep(1);

  const handleAnswer = (weight: number, answerText: string) => {
    const currentQuestion = questions[step - 1];
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answerText }));
    setScore(score + weight);
    
    if (step < questions.length) {
      setStep(step + 1);
    } else {
      setStep(questions.length + 1); // Calculating
    }
  };

  const getResult = useCallback(() => {
    if (score <= 6) return {
      title: "O Diamante Bruto",
      desc: "Você possui uma luz natural que atrai olhares, mas sua transparência excessiva faz com que ele sinta que já te 'conquistou' por completo. No jogo da sedução, o que é fácil de ler torna-se previsível rapidamente.",
      advice: "O seu próximo passo é ativar o 'Escudo de Mistério' para que ele pare de te ver como uma opção e comece a te ver como um prêmio raro."
    };
    if (score <= 10) return {
      title: "A Mulher em Ascensão",
      desc: "Você já despertou para o seu valor, mas ainda permite que pequenas atitudes dele desestabilizem sua paz. Você oscila entre a força e a carência, e ele percebe essa brecha emocional.",
      advice: "Para se tornar a prioridade absoluta, você precisa dominar a 'Psicologia do Investimento' e fazer com que ele lute pela sua atenção."
    };
    return {
      title: "A Mulher Magnética",
      desc: "Seu magnetismo é inegável e você já sabe como prender a atenção. No entanto, existe um nível de controle que você ainda não acessou — aquele que faz um homem se sentir verdadeiramente 'viciado' na sua essência.",
      advice: "O toque final é o 'Código da Presença Inesquecível', transformando sua imagem na única que habita os pensamentos dele."
    };
  }, [score]);

  const saveResult = useCallback(async () => {
    if (isSaving || resultId) return;
    setIsSaving(true);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        console.warn('Supabase is not configured. Skipping save.');
        return;
      }

      const result = getResult();
      const { data, error } = await supabase
        .from('quiz_results')
        .insert([
          {
            score,
            result_title: result.title,
            answers: answers,
            metadata: {
              user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
              platform: typeof window !== 'undefined' ? window.navigator.platform : 'unknown'
            }
          }
        ])
        .select('id')
        .single();

      if (error) {
        console.error('Supabase Insert Error:', error.message, error.details, error.hint);
        throw error;
      }
      if (data) {
        setResultId(data.id);
        console.log('Result saved successfully with ID:', data.id);
      }
    } catch (err) {
      console.error('Error saving result:', err);
    } finally {
      setIsSaving(false);
    }
  }, [score, answers, isSaving, resultId, getResult]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingContact || !resultId) return;
    setIsSubmittingContact(true);

    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('quiz_results')
        .update({
          whatsapp: whatsapp
        })
        .eq('id', resultId);

      if (error) {
        console.error('Supabase Update Error:', error.message, error.details, error.hint);
        throw error;
      }
      
      // Send to n8n webhook via internal proxy to avoid CORS issues
      try {
        await fetch('/api/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            whatsapp,
            perfil: getResult().title,
            resultId
          }),
        });
        console.log('Webhook sent successfully');
      } catch (webhookErr) {
        console.error('Error sending to webhook:', webhookErr);
      }

      console.log('Contact updated successfully');
      setIsContactSaved(true);
      
      // Close modal after a short delay to show success, but do NOT redirect
      setTimeout(() => {
        setIsModalOpen(false);
        setIsContactSaved(false);
      }, 2500);
    } catch (err) {
      console.error('Error saving contact:', err);
    } finally {
      setIsSubmittingContact(false);
    }
  };

  useEffect(() => {
    if (step === questions.length + 1) {
      saveResult();
      const timer = setTimeout(() => setStep(questions.length + 2), 3000); // Result
      return () => clearTimeout(timer);
    }
  }, [step, saveResult]);

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-violet-500/30">
      <div className="max-w-xl mx-auto px-6 py-6 flex flex-col min-h-screen justify-center">
        
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <div className="relative w-44 h-44 mx-auto mb-2">
                <div className="absolute inset-0 bg-violet-600/40 blur-[80px] rounded-full animate-pulse" />
                <Image 
                  src="https://curtai.online/logosf.png"
                  alt="Mistika Logo"
                  fill
                  sizes="(max-width: 768px) 176px, 176px"
                  className="object-contain relative z-10"
                  referrerPolicy="no-referrer"
                  priority
                />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-widest animate-bounce-subtle">
                <Sparkles className="w-3 h-3" /> Presente Exclusivo no Final
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] bg-gradient-to-b from-white via-white to-zinc-600 bg-clip-text text-transparent">
                O CÓDIGO <br /> <span className="text-violet-500">MAGNETISMO</span>
              </h1>

              <div className="space-y-6">
                <p className="text-zinc-300 text-lg md:text-xl leading-snug max-w-md mx-auto font-medium">
                  Descubra seu nível real de atração e receba o <span className="text-violet-400 underline decoration-violet-500/30 underline-offset-4">Guia de Relacionamento (PDF)</span> gratuitamente ao finalizar. 🎁
                </p>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleStart}
                    className="w-full py-5 bg-violet-600 hover:bg-violet-500 transition-all rounded-2xl text-xl font-black shadow-[0_0_40px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2 group relative overflow-hidden"
                  >
                    <span className="relative z-10">REVELAR MEU PODER AGORA</span>
                    <ChevronRight className="group-hover:translate-x-1 transition-transform relative z-10" />
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </button>
                  
                  <p className="text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
                    <span className="flex items-center gap-4">
                      <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> 100% Seguro</span>
                      <span className="flex items-center gap-1 text-amber-500/80 font-medium"><Sparkles className="w-3 h-3" /> Oferta por Tempo Limitado</span>
                    </span>
                    <span className="opacity-60">+12.4k mulheres já descobriram seu poder</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step >= 1 && step <= questions.length && (
            <motion.div
              key={`q-${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-end mb-2">
                <span className="text-violet-500 font-mono text-sm tracking-widest uppercase">Pergunta {step} de {questions.length}</span>
                <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-violet-500" 
                    initial={{ width: 0 }}
                    animate={{ width: `${(step / questions.length) * 100}%` }}
                  />
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-light leading-tight">
                {questions[step - 1].question}
              </h2>
              <div className="space-y-4">
                {questions[step - 1].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt.weight, opt.text)}
                    className="w-full p-4 text-left bg-[#080808] hover:bg-[#0c0c0c] border border-white/5 hover:border-violet-500/50 transition-all rounded-2xl text-lg group flex items-center justify-between"
                  >
                    <span>{opt.text}</span>
                    <div className="w-6 h-6 rounded-full border border-white/10 group-hover:border-violet-500 flex items-center justify-center transition-colors">
                      <div className="w-2 h-2 rounded-full bg-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === questions.length + 1 && (
            <motion.div
              key="calculating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-8"
            >
              <div className="relative w-24 h-24 mx-auto">
                <motion.div
                  className="absolute inset-0 border-4 border-violet-500/20 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 border-t-4 border-violet-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image 
                    src="https://curtai.online/logosf.png"
                    alt="Mistika Logo"
                    width={80}
                    height={80}
                    className="object-contain opacity-40"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <h2 className="text-2xl font-light tracking-tight">Analisando seu perfil psicológico...</h2>
              <div className="space-y-3 max-w-xs mx-auto">
                <div className="flex items-center justify-between text-[10px] text-violet-400 font-mono uppercase tracking-widest">
                  <span>Processando Perfil</span>
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    Ativo
                  </motion.span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-violet-500"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                  />
                </div>
                <p className="text-zinc-400 text-sm animate-pulse">Cruzando dados de comportamento digital...</p>
                <p className="text-zinc-400 text-sm animate-pulse delay-75">Avaliando níveis de autovalorização...</p>
                <p className="text-zinc-400 text-sm animate-pulse delay-150">Sincronizando com as leis do magnetismo...</p>
              </div>
            </motion.div>
          )}

          {step === questions.length + 2 && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-3xl bg-[#080808] border border-violet-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-15">
                  <Image 
                    src="https://curtai.online/logosf.png"
                    alt="Mistika Logo"
                    width={180}
                    height={180}
                    className="object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="text-violet-500 font-mono text-sm tracking-widest uppercase mb-2">Seu Perfil:</h3>
                <h2 className="text-2xl md:text-3xl font-medium mb-4">{getResult().title}</h2>
                <p className="text-zinc-300 text-base leading-relaxed mb-4">
                  {getResult().desc}
                </p>
                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-start gap-3">
                  <Zap className="w-5 h-5 text-violet-500 shrink-0 mt-1" />
                  <p className="text-violet-100 font-medium">{getResult().advice}</p>
                </div>
              </div>

              <div className="space-y-6 text-center">
                <p className="text-zinc-400 text-sm italic px-4">
                  Existe um segredo que 97% das mulheres ignoram sobre a psicologia masculina. Você está a um passo de descobrir como ativar o instinto de perseguição dele.
                </p>
                <button 
                  onClick={() => {
                    setIsModalOpen(true);
                  }}
                  className="w-full py-5 bg-violet-600 text-white hover:bg-violet-500 transition-all rounded-2xl text-xl font-black flex flex-col items-center justify-center gap-0 shadow-xl shadow-violet-900/40 animate-bounce-subtle group"
                >
                  <span className="flex items-center gap-2">
                    BAIXAR GUIA + ATIVAR AGORA
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] opacity-70 font-medium">Acesso imediato ao seu presente</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer info */}
        <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap justify-center gap-6 text-zinc-400 text-xs uppercase tracking-widest font-medium">
          <div className="flex items-center gap-2"><User className="w-3 h-3" /> +12.4k Mulheres Ativas</div>
          <div className="flex items-center gap-2"><Heart className="w-3 h-3" /> Relações Transformadas</div>
        </div>

        {/* Modal for Contact */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-[#080808] border border-violet-500/30 p-8 rounded-3xl max-w-sm w-full relative overflow-hidden"
              >
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/20 blur-[60px] rounded-full" />
                
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="text-center space-y-4 relative z-10">
                  <div className="w-16 h-16 bg-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <MessageCircle className="w-8 h-8 text-violet-500" />
                  </div>
                  <h2 className="text-2xl font-bold">Onde enviamos seu <span className="text-violet-500">Presente?</span></h2>
                  <p className="text-zinc-400 text-sm">
                    Informe seu WhatsApp abaixo para receber o <span className="text-white font-medium">Guia de Relacionamento (PDF)</span> e o acesso ao portal.
                  </p>

                  <form onSubmit={handleContactSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">WhatsApp com DDD</label>
                      <input
                        type="tel"
                        required
                        placeholder="(00) 00000-0000"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full bg-black border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-700 outline-none transition-all"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmittingContact || isContactSaved}
                      className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-all rounded-xl text-lg font-bold shadow-lg shadow-violet-900/40 flex items-center justify-center gap-2"
                    >
                      {isSubmittingContact ? 'Enviando...' : isContactSaved ? 'PDF ENVIADO COM SUCESSO!' : 'RECEBER PRESENTE AGORA'}
                    </button>
                    
                    <p className="text-[10px] text-zinc-600 uppercase tracking-tighter">
                      Prometemos não enviar spam. Seus dados estão seguros.
                    </p>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
