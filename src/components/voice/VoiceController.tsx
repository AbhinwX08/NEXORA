import React, { useState, useRef, useEffect } from "react";
import { Mic, Volume2, VolumeX, Loader2, Square, AlertCircle } from "lucide-react";
import { transcribeAudio, synthesizeSpeech } from "@/lib/api";

export interface VoiceInputButtonProps {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export interface SpeechPlaybackButtonProps {
  textToSpeak: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Global audio lock to enforce strict half-duplex rules:
 * 1. Microphone stream is completely aborted/stopped before TTS playback starts.
 * 2. When playback finishes, microphone stays OFF.
 * 3. Never allow simultaneous recording and playback.
 */
class HalfDuplexManager {
  private activeMediaRecorder: MediaRecorder | null = null;
  private activeStream: MediaStream | null = null;
  private activeAudioElement: HTMLAudioElement | null = null;
  private onPlaybackStopListeners: Set<() => void> = new Set();

  registerRecorder(recorder: MediaRecorder, stream: MediaStream) {
    this.stopPlayback();
    this.activeMediaRecorder = recorder;
    this.activeStream = stream;
  }

  stopRecording() {
    if (this.activeMediaRecorder && this.activeMediaRecorder.state !== "inactive") {
      try {
        this.activeMediaRecorder.stop();
      } catch (e) {
        // ignore
      }
    }
    if (this.activeStream) {
      this.activeStream.getTracks().forEach((track) => track.stop());
      this.activeStream = null;
    }
    this.activeMediaRecorder = null;
  }

  registerAudio(audio: HTMLAudioElement, onStop: () => void) {
    // Strict rule: Halt any active recording first
    this.stopRecording();
    this.stopPlayback();

    this.activeAudioElement = audio;
    this.onPlaybackStopListeners.add(onStop);

    audio.onended = () => {
      this.stopPlayback();
    };
    audio.onerror = () => {
      this.stopPlayback();
    };
  }

  stopPlayback() {
    if (this.activeAudioElement) {
      try {
        this.activeAudioElement.pause();
        this.activeAudioElement.currentTime = 0;
      } catch (e) {
        // ignore
      }
      this.activeAudioElement = null;
    }
    this.onPlaybackStopListeners.forEach((fn) => fn());
    this.onPlaybackStopListeners.clear();
  }
}

export const halfDuplexManager = new HalfDuplexManager();

/**
 * Half-Duplex Microphone Recording Component
 */
export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscribed,
  disabled = false,
  className = "",
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const stopRecordingCleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    halfDuplexManager.stopRecording();
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const startRecording = async () => {
    setErrorMessage(null);
    // Halt any active speech playback before opening microphone
    halfDuplexManager.stopPlayback();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not supported in this browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 0) {
          await handleSendAudio(audioBlob);
        }
      };

      halfDuplexManager.registerRecorder(mediaRecorder, stream);
      mediaRecorder.start(250); // collect 250ms chunks
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn("Microphone start error:", err);
      setErrorMessage(err.message || "Could not access microphone.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    halfDuplexManager.stopRecording();
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const handleSendAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    setErrorMessage(null);
    try {
      const res = await transcribeAudio(blob);
      if (res && res.transcription) {
        onTranscribed(res.transcription);
      } else {
        setErrorMessage("No speech detected. Please speak clearly.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to transcribe speech.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={toggleRecording}
        disabled={disabled || isTranscribing}
        className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all shadow-sm ${
          isRecording
            ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse"
            : isTranscribing
            ? "bg-amber-500 text-white cursor-wait"
            : "bg-[#17263D] hover:bg-[#223554] text-white/80 hover:text-white border border-white/10"
        }`}
        title={
          isRecording
            ? `Recording (${recordingSeconds}s) — Click to send`
            : isTranscribing
            ? "Transcribing audio..."
            : "Click to speak query (Half-duplex voice input)"
        }
        aria-label="Toggle voice recording"
      >
        {isTranscribing ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : isRecording ? (
          <Square className="w-4 h-4 fill-white text-white" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {/* Recording Duration Pill */}
      {isRecording && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-mono font-bold rounded-full shadow-lg whitespace-nowrap">
          REC {recordingSeconds}s
        </span>
      )}

      {/* Error Tooltip */}
      {errorMessage && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 px-2.5 py-1.5 bg-rose-950/90 border border-rose-500/30 text-rose-200 text-xs rounded-lg shadow-xl whitespace-nowrap flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-1 text-rose-400 hover:text-white text-xs font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Half-Duplex Text-to-Speech Playback Button
 */
export const SpeechPlaybackButton: React.FC<SpeechPlaybackButtonProps> = ({
  textToSpeak,
  disabled = false,
  className = "",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleTogglePlayback = async () => {
    setAudioError(null);

    // If currently playing, stop it immediately
    if (isPlaying) {
      halfDuplexManager.stopPlayback();
      setIsPlaying(false);
      return;
    }

    if (!textToSpeak.trim()) return;

    // Halt any active recording before starting TTS
    halfDuplexManager.stopRecording();
    setIsLoading(true);

    try {
      const audioBlob = await synthesizeSpeech({ text: textToSpeak });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      halfDuplexManager.registerAudio(audio, () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      });

      await audio.play();
      setIsPlaying(true);
    } catch (err: any) {
      console.warn("Speech playback error:", err);
      setAudioError(err.message || "Failed to synthesize speech.");
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleTogglePlayback}
        disabled={disabled || isLoading}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
          isPlaying
            ? "bg-[#20C6B6] text-black font-semibold shadow-sm animate-pulse"
            : "text-white/60 hover:text-white hover:bg-white/5"
        }`}
        title={isPlaying ? "Stop speech" : "Read aloud (Half-duplex Speech Synthesis)"}
        aria-label="Read response aloud"
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isPlaying ? (
          <>
            <VolumeX className="w-3.5 h-3.5 text-black" />
            <span className="text-[11px] font-mono">Stop</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">Listen</span>
          </>
        )}
      </button>

      {audioError && (
        <div className="absolute top-full mt-1 left-0 z-50 px-2 py-1 bg-rose-900 border border-rose-500 text-rose-200 text-[10px] rounded shadow-lg whitespace-nowrap">
          {audioError}
        </div>
      )}
    </div>
  );
};
