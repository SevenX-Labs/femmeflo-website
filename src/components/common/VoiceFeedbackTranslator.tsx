"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Loader2, Sparkles, Check, Globe, AlertCircle, X, RotateCcw } from "lucide-react";
import { translateHindiOrHinglishToEnglish } from "@/lib/api/translate";

interface VoiceFeedbackTranslatorProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  label?: string;
  sublabel?: string;
  rows?: number;
  className?: string;
  required?: boolean;
  quickChips?: string[];
}

export function VoiceFeedbackTranslator({
  value,
  onChange,
  placeholder = "e.g. Shopkeeper ordered 15 packs of XL pads, requested delivery by Saturday...",
  label = "Customer Feedback & Observations",
  sublabel = "Field feedback automatically translates spoken Hindi or Hinglish into professional English",
  rows = 3,
  className = "",
  required = false,
  quickChips = [
    "Shopkeeper requested restock next week",
    "Owner was unavailable, revisit scheduled",
    "Customer very satisfied with pad softness",
    "Payment promised via UPI in 2 days",
    "Competitor sample offered at lower rate",
  ],
}: VoiceFeedbackTranslatorProps) {
  const [isListening, setIsListening] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [spokenLanguage, setSpokenLanguage] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [translationAudit, setTranslationAudit] = useState<{ original: string; translated: string } | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef(false);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          isManuallyStoppedRef.current = true;
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const handleStartListening = useCallback(() => {
    setSpeechError(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in this browser. Please type feedback manually.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = spokenLanguage;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      isManuallyStoppedRef.current = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim();
        setIsListening(false);

        if (!transcript) return;

        setIsTranslating(true);
        try {
          const result = await translateHindiOrHinglishToEnglish(transcript);
          const translated = result.translatedText || transcript;

          setTranslationAudit({
            original: transcript,
            translated: translated,
          });

          // Append to existing text or set
          onChange(value ? `${value.trim()} ${translated}` : translated);
        } catch (err) {
          console.error("Translation failed:", err);
          onChange(value ? `${value.trim()} ${transcript}` : transcript);
        } finally {
          setIsTranslating(false);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === "no-speech") {
          setSpeechError("No speech detected. Please try speaking closer to the microphone.");
        } else if (event.error === "not-allowed") {
          setSpeechError("Microphone access was denied. Please allow microphone permissions in your browser.");
        } else {
          setSpeechError(`Speech recognition error: ${event.error || "unknown"}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Failed to initialize speech recognition:", err);
      setIsListening(false);
      setSpeechError(err.message || "Could not start microphone.");
    }
  }, [spokenLanguage, value, onChange]);

  const handleStopListening = useCallback(() => {
    if (recognitionRef.current) {
      isManuallyStoppedRef.current = true;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  }, []);

  const handleRevertLastTranslation = useCallback(() => {
    if (!translationAudit) return;
    const { translated } = translationAudit;
    const current = value;
    if (current.endsWith(translated)) {
      onChange(current.slice(0, -translated.length).trim());
    }
    setTranslationAudit(null);
  }, [translationAudit, value, onChange]);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with Title and Voice Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-bold text-zinc-800">
            {label} {required && <span className="text-[#E61C5D]">*</span>}
          </label>
          {sublabel && <p className="text-[11px] text-zinc-500 mt-0.5">{sublabel}</p>}
        </div>

        {/* Action Controls: Language Toggle & Voice Microphone Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Spoken Language Selector Pill */}
          <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 text-[10px] font-bold text-zinc-600">
            <button
              type="button"
              onClick={() => setSpokenLanguage("hi-IN")}
              className={`rounded-md px-2 py-1 transition cursor-pointer ${
                spokenLanguage === "hi-IN"
                  ? "bg-white text-[#E61C5D] shadow-xs font-extrabold"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
              title="Speak in Hindi / Hinglish phonetics"
            >
              हिन्दी / Hinglish
            </button>
            <button
              type="button"
              onClick={() => setSpokenLanguage("en-IN")}
              className={`rounded-md px-2 py-1 transition cursor-pointer ${
                spokenLanguage === "en-IN"
                  ? "bg-white text-[#E61C5D] shadow-xs font-extrabold"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
              title="Speak in Indian English / Hinglish"
            >
              English
            </button>
          </div>

          {/* Voice Microphone Record Button */}
          {isListening ? (
            <button
              type="button"
              onClick={handleStopListening}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm ring-2 ring-rose-300 animate-pulse hover:bg-rose-700 transition cursor-pointer"
            >
              <MicOff className="h-3.5 w-3.5" />
              <span>Stop</span>
            </button>
          ) : isTranslating ? (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 border border-purple-200 px-3 py-1.5 text-xs font-bold text-purple-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Translating to English…</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartListening}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200/90 px-3 py-1.5 text-xs font-bold text-[#E61C5D] hover:bg-rose-100 hover:border-rose-300 transition shadow-xs cursor-pointer"
              title="Speak in Hindi or Hinglish — automatically translates to English text"
            >
              <Mic className="h-3.5 w-3.5 text-[#E61C5D]" />
              <span>Speak Hindi / Hinglish</span>
              <Sparkles className="h-3 w-3 text-amber-500" />
            </button>
          )}
        </div>
      </div>

      {/* Active Listening Indicator Banner */}
      {isListening && (
        <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-3 shadow-xs flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E61C5D]"></span>
            </span>
            <span className="font-semibold text-rose-950">
              Listening in {spokenLanguage === "hi-IN" ? "Hindi / Hinglish" : "English"}… Speak now (e.g., &ldquo;Customer ne bola payment kal karega&rdquo;)
            </span>
          </div>
          <button
            type="button"
            onClick={handleStopListening}
            className="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer"
          >
            Done speaking
          </button>
        </div>
      )}

      {/* Speech / Permission Error Banner */}
      {speechError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{speechError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSpeechError(null)}
            className="text-amber-800 hover:text-amber-950 p-0.5 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Feedback Textarea */}
      <div className="relative">
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] p-3 text-sm text-zinc-900 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100 placeholder:text-zinc-400"
        />
      </div>

      {/* Spoken Translation Audit Confirmation Badge */}
      {translationAudit && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-2.5 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="text-[11px] truncate">
              <span className="text-zinc-500 font-medium">Spoken Hindi: </span>
              <span className="font-semibold italic text-zinc-800">&ldquo;{translationAudit.original}&rdquo;</span>
              <span className="mx-1 text-emerald-600 font-bold">→ Translated to English</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleRevertLastTranslation}
              className="inline-flex items-center gap-1 rounded bg-white border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              title="Remove this spoken snippet"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Undo</span>
            </button>
            <button
              type="button"
              onClick={() => setTranslationAudit(null)}
              className="rounded p-0.5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Observation Chips */}
      {quickChips && quickChips.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 block">
            Quick Market Feedback Chips
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickChips.map((chip, idx) => {
              const isSelected = value.includes(chip);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      onChange(value.replace(chip, "").replace(/\s{2,}/g, " ").trim());
                    } else {
                      onChange(value ? `${value.trim()} • ${chip}` : chip);
                    }
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? "bg-[#E61C5D] text-white shadow-xs"
                      : "bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  {isSelected ? `✓ ${chip}` : `+ ${chip}`}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Standalone button that can be attached to any textarea or text field
 */
export function VoiceFeedbackButton({
  onTranslateComplete,
  className = "",
}: {
  onTranslateComplete: (translatedEnglish: string, originalHindi: string) => void;
  className?: string;
}) {
  const [isListening, setIsListening] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "hi-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = async (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript?.trim();
        setIsListening(false);
        if (!transcript) return;

        setIsTranslating(true);
        try {
          const res = await translateHindiOrHinglishToEnglish(transcript);
          onTranslateComplete(res.translatedText || transcript, transcript);
        } catch (err) {
          onTranslateComplete(transcript, transcript);
        } finally {
          setIsTranslating(false);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  if (isListening) {
    return (
      <button
        type="button"
        onClick={stopListening}
        className={`inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-rose-300 animate-pulse ${className}`}
      >
        <MicOff className="h-3 w-3" />
        <span>Listening... Stop</span>
      </button>
    );
  }

  if (isTranslating) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-lg bg-purple-50 border border-purple-200 px-2 py-1 text-[11px] font-bold text-purple-700 ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Translating…</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={startListening}
      className={`inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-2 py-1 text-[11px] font-bold text-[#E61C5D] hover:bg-rose-100 transition shadow-xs ${className}`}
      title="Speak in Hindi/Hinglish — auto-translates to English"
    >
      <Mic className="h-3 w-3 text-[#E61C5D]" />
      <span>Speak Hindi/Hinglish</span>
      <Sparkles className="h-2.5 w-2.5 text-amber-500" />
    </button>
  );
}
