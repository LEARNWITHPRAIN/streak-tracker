import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  X, 
  Sparkles, 
  Lock, 
  Loader2, 
  ChevronDown, 
  MessageSquare,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallModal } from '@/components/paywall/PaywallModal';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const NVIDIA_KEY = import.meta.env.VITE_NVIDIA_API_KEY;

export const YodhaAI: React.FC = () => {
  const { isPremium } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Jai Hind Warrior! I am Yodha AI, your personal fitness commander. How can I assist your workout or nutrition today? You can speak to me with the mic or type below!',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [loadingResponse, setLoadingResponse] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll to latest message
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle Assistant Floating Button Click
  const handleAssistantClick = () => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }
    setIsOpen(!isOpen);
  };

  // Text-To-Speech (Voice Output)
  const speakText = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // stop previous
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick best voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Speech-To-Text (Microphone Input)
  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Voice recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        toast.info('Listening... Speak now 🎙️');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          sendMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Recognition error:', err);
      setIsListening(false);
    }
  };

  const callNvidiaChat = async (
    model: string,
    systemPrompt: string,
    msgs: Message[]
  ): Promise<string> => {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NVIDIA_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...msgs.slice(-6),
        ],
        temperature: 0.6,
        max_tokens: 250,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`NVIDIA API error [${model}] ${response.status}:`, errText);
      throw new Error(`NVIDIA ${response.status}: ${errText.slice(0, 120)}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  };

  const sendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || loadingResponse) return;

    if (!NVIDIA_KEY) {
      toast.error('NVIDIA API key not configured. Contact the app admin.');
      return;
    }

    setInputText('');
    const userMsg: Message = { role: 'user', content: messageContent };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    setLoadingResponse(true);
    try {
      const systemPrompt = `You are Yodha AI, a motivational, elite, and disciplined Indian fitness and workout assistant for "Yodha Mode".
Your tone is inspiring, scientific, sharp, and warrior-like ("Jai Hind Warrior!", "Let's conquer this set!").
Help the user track exercise reps, sets, diet macros, posture tips, and recovery. Keep responses concise (2 to 4 sentences maximum) so it sounds natural when spoken aloud.`;

      let assistantReply = '';
      try {
        // Try primary model first
        assistantReply = await callNvidiaChat('meta/llama-3.1-70b-instruct', systemPrompt, updatedMessages);
      } catch (primaryErr) {
        console.warn('Primary model failed, trying fallback model:', primaryErr);
        toast.info('Switching to backup AI model...');
        // Fallback to smaller model
        assistantReply = await callNvidiaChat('meta/llama-3.1-8b-instruct', systemPrompt, updatedMessages);
      }

      if (!assistantReply) {
        assistantReply = 'Keep pushing hard, Warrior! Stay consistent with your training and nutrition!';
      }

      setMessages([...updatedMessages, { role: 'assistant', content: assistantReply }]);
      speakText(assistantReply);
    } catch (err: any) {
      console.error('Yodha AI error (all models failed):', err);
      toast.error(`AI unavailable: ${err?.message?.slice(0, 80) || 'Check your NVIDIA API key'}`);
      // Still add a motivational fallback so chat doesn't break
      const fallback = 'The AI is temporarily offline, Warrior. Stay disciplined — log your macros and crush your workout!';
      setMessages([...updatedMessages, { role: 'assistant', content: fallback }]);
      speakText(fallback);
    } finally {
      setLoadingResponse(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleAssistantClick}
          className="group relative flex items-center gap-2 p-3 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-bold shadow-2xl shadow-orange-500/30 border border-orange-400/40 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {/* Animated pulsing aura */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 opacity-60 blur-md group-hover:opacity-100 animate-pulse transition duration-500" />

          <div className="relative flex items-center gap-2">
            <div className="relative">
              <Bot className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-300" />
              </span>
            </div>

            <span className="hidden sm:inline text-xs tracking-wider uppercase font-black">
              Yodha AI
            </span>

            {!isPremium && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-black/40 text-yellow-300 border border-yellow-400/40">
                <Lock className="w-2.5 h-2.5" /> PRO
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Floating Chat Modal (Unlocked for PRO) */}
      {isOpen && isPremium && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] h-[520px] max-h-[80vh] z-50 rounded-2xl bg-card/95 backdrop-blur-2xl border border-primary/40 shadow-2xl shadow-primary/10 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-orange-950/40 via-background to-background border-b border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/30">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  Yodha AI Commander
                  <span className="text-[10px] font-mono text-primary px-1.5 py-0.2 rounded bg-primary/15">Active</span>
                </h4>
                <p className="text-[10px] text-muted-foreground">Voice & Nutrition Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  voiceEnabled
                    ? 'border-primary/40 text-primary bg-primary/10'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
                title={voiceEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
              >
                {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground font-medium rounded-br-none shadow-md'
                      : 'bg-muted/60 border border-border/80 text-foreground rounded-bl-none shadow-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loadingResponse && (
              <div className="flex gap-2.5 items-center">
                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="p-2.5 rounded-2xl bg-muted/60 border border-border/80 text-xs flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Strategizing...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-background/80 border-t border-border/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-xl border transition-all ${
                  isListening
                    ? 'bg-red-500 text-white border-red-400 animate-pulse'
                    : 'bg-muted/70 text-muted-foreground hover:text-primary hover:border-primary/40'
                }`}
                title="Speak to Yodha AI"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <Input
                type="text"
                placeholder={isListening ? 'Listening to your voice...' : 'Ask workout or diet advice...'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-card/60 border-border text-foreground text-xs rounded-xl"
              />

              <Button
                type="submit"
                size="sm"
                disabled={!inputText.trim() || loadingResponse}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-3 rounded-xl font-bold"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Paywall if Free User Clicks AI Assistant */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="ai"
      />
    </>
  );
};
