import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Sliders, Settings } from "lucide-react";
import { AnimatePresence } from "motion/react";

interface SpeakButtonProps {
  text: string;
  className?: string;
}

export default function SpeakButton({ text, className = "" }: SpeakButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(0.75);
  const [gender, setGender] = useState<"female" | "male">("female");
  const [showOptions, setShowOptions] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const hasSpeechSynthesis = typeof window !== "undefined" && window.speechSynthesis;

    if (isPlaying) {
      if (hasSpeechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    if (!hasSpeechSynthesis) {
      // Fallback for Median.co and mobile webview wrappers lacking standard SpeechSynthesis API.
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audioUrl = `/api/tts?q=${encodeURIComponent(text)}&tl=de`;
      const audio = new Audio(audioUrl);
      audio.playbackRate = 0.75;
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setIsPlaying(false);
      };

      setIsPlaying(true);
      
      // Attempt play, handling auto-play policy constraints
      audio.play().catch((err) => {
        console.error("Audio playback failed:", err);
        setIsPlaying(false);
      });
      return;
    }

    // Cancel current speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = speed;

    // Retrieve German voices
    const voices = window.speechSynthesis.getVoices();
    const deVoices = voices.filter(v => v.lang.startsWith("de"));
    
    if (deVoices.length > 0) {
      let chosenVoice = deVoices[0];
      
      if (gender === "male") {
        // Yannick, Dieter, Stefan, Microsoft Stefan, Google Deutsch Male, etc.
        const malePatterns = ["yannick", "dieter", "stefan", "male", "man", "de-de-m"];
        const foundMale = deVoices.find(v => 
          malePatterns.some(p => v.name.toLowerCase().includes(p))
        );
        if (foundMale) chosenVoice = foundMale;
      } else {
        // Hedda, Katrin, female, Google Deutsch Female, Microsoft Hedda, etc.
        const femalePatterns = ["hedda", "katrin", "katja", "female", "woman", "de-de-f"];
        const foundFemale = deVoices.find(v => 
          femalePatterns.some(p => v.name.toLowerCase().includes(p))
        );
        if (foundFemale) chosenVoice = foundFemale;
      }
      
      utterance.voice = chosenVoice;
    }

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={`inline-flex items-center gap-1.5 relative ${className}`} dir="rtl">
      <button
        onClick={handleSpeak}
        className={`p-1.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
          isPlaying 
            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500" 
            : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
        }`}
        title="استمع للنطق الألماني الطبيعي 🔊"
      >
        {isPlaying ? (
          <VolumeX className="w-4 h-4 animate-pulse" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>

      {/* Adjust speech speed and speaker gender controls */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowOptions(!showOptions);
        }}
        className={`p-1.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
          showOptions 
            ? "bg-slate-800 border-blue-500/50 text-blue-300" 
            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
        }`}
        title="تغيير الصوت وجودة القراءة الصوتية"
      >
        <Sliders className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {showOptions && (
          <>
            {/* Backdrop click closer */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={(e) => {
                e.stopPropagation();
                setShowOptions(false);
              }}
            />
            <div className="absolute top-9 left-0 z-20 w-36 p-3 rounded-xl bg-slate-950 border border-slate-850 shadow-2xl space-y-2.5 text-right text-[10px]" onClick={(e) => e.stopPropagation()}>
              <div>
                <span className="text-slate-500 font-bold block mb-1">نوع المعلم الصوتي:</span>
                <div className="grid grid-cols-2 gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-center">
                  <button
                    onClick={() => setGender("female")}
                    className={`py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      gender === "female" 
                        ? "bg-blue-600 text-white" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    امرأة 👩‍🏫
                  </button>
                  <button
                    onClick={() => setGender("male")}
                    className={`py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      gender === "male" 
                        ? "bg-blue-600 text-white" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    رجل 👨‍🏫
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
