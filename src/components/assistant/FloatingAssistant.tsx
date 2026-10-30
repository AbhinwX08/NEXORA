import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Sparkles,
  Bot,
  RotateCcw,
  Copy,
  Check,
  Star,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Headphones,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { sendAssistantMessage, submitFeedback } from "@/lib/api";
import { AssistantChatResponse } from "@/types/api";
import { VoiceInputButton, SpeechPlaybackButton } from "@/components/voice/VoiceController";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  responseMeta?: AssistantChatResponse;
  feedbackGiven?: boolean;
}

const PRODUCT_GUIDE_CHIPS = [
  "What dataset was RELAY AI trained on?",
  "How does Platt sigmoid calibration work?",
  "What are the 5 canonical decision outcomes?",
  "Explain the hybrid retrieval formula (RRF)",
];

const SUPPORT_DEMO_CHIPS = [
  "Where is my order #98214?",
  "I want to request a full refund",
  "I need to speak to a real human agent now",
  "How can I change my shipping address?",
];

export const FloatingAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"product_guide" | "support_demo">("product_guide");
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => `sess_${Math.random().toString(36).substring(2, 9)}`);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "Hello! I am RELAY Assistant. I can explain the platform's multi-agent architecture, training corpus (18,810 rows), and Platt calibration — or simulate live customer support inquiries. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Feedback states per message
  const [activeFeedbackMsgId, setActiveFeedbackMsgId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [helpful, setHelpful] = useState<boolean>(true);
  const [comment, setComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSourcesId, setExpandedSourcesId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleResetSession = () => {
    const newSession = `sess_${Math.random().toString(36).substring(2, 9)}`;
    setSessionId(newSession);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "assistant",
        text: `Session reset (${newSession}). You are in ${
          activeTab === "product_guide" ? "Product Guide" : "Support Demo"
        } mode. What would you like to explore?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend !== undefined ? textToSend : inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const res = await sendAssistantMessage({
        session_id: sessionId,
        message: query,
        customer_context: {
          preferred_mode: activeTab,
        },
      });

      const assistantMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        sender: "assistant",
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        responseMeta: res,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: "assistant",
        text: `Error contacting backend: ${err.message || "Failed to get reply."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmitFeedback = async (msg: ChatMessage) => {
    if (!msg.responseMeta) return;
    setIsSubmittingFeedback(true);
    try {
      await submitFeedback({
        query: msg.text,
        intent: msg.responseMeta.intent_detected || "assistant_chat",
        final_decision: msg.responseMeta.final_decision || msg.responseMeta.routing_mode,
        rating,
        helpful,
        comment: comment.trim() || undefined,
        request_id: sessionId,
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, feedbackGiven: true } : m))
      );
      setActiveFeedbackMsgId(null);
      setComment("");
    } catch (err) {
      console.error("Feedback submit error:", err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <>
      {/* Floating Launch Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#456BFA] to-[#20C6B6] text-white shadow-[0_8px_30px_rgb(69,107,250,0.35)] hover:shadow-[0_8px_35px_rgb(69,107,250,0.5)] hover:scale-105 active:scale-95 transition-all select-none group"
          aria-label="Open RELAY Assistant"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white animate-spin-slow" />
          </div>
          <span className="font-semibold text-sm tracking-tight pr-1">RELAY Assistant</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      )}

      {/* Floating Assistant Popover Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] h-[600px] max-h-[85vh] bg-[#101A2B] text-white rounded-2xl shadow-2xl border border-white/15 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3.5 border-b border-white/10 bg-[#17263D] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#456BFA] to-[#20C6B6] flex items-center justify-center text-white shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-white">RELAY Assistant</span>
                  <span className="px-1.5 py-0.2 bg-[#20C6B6]/20 text-[#20C6B6] text-[9px] font-mono rounded border border-[#20C6B6]/30 font-semibold uppercase">
                    Grounded RAG
                  </span>
                </div>
                <span className="text-[10px] text-white/50 font-mono">
                  Session: {sessionId.substring(0, 12)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetSession}
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title="Reset session conversation"
                aria-label="Reset session"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title="Close Assistant"
                aria-label="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#101A2B] border-b border-white/10 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("product_guide")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                activeTab === "product_guide"
                  ? "bg-[#456BFA] text-white shadow"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Product Guide</span>
            </button>
            <button
              onClick={() => setActiveTab("support_demo")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                activeTab === "support_demo"
                  ? "bg-[#20C6B6] text-black font-bold shadow"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Support Demo</span>
            </button>
          </div>

          {/* Suggestion Chips */}
          <div className="px-3 py-2 bg-[#17263D]/60 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(activeTab === "product_guide" ? PRODUCT_GUIDE_CHIPS : SUPPORT_DEMO_CHIPS).map(
              (chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  disabled={isLoading}
                  className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[11px] border border-white/10 transition-colors whitespace-nowrap"
                >
                  {chip}
                </button>
              )
            )}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans text-xs sm:text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs sm:text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#456BFA] text-white rounded-br-none"
                      : "bg-[#17263D] text-white/90 rounded-bl-none border border-white/10"
                  }`}
                >
                  {/* Routing Mode Badge on Assistant Reply */}
                  {msg.responseMeta && (
                    <div className="flex items-center justify-between gap-2 pb-1 mb-1 border-b border-white/10 text-[10px] font-mono text-white/60">
                      <span className="uppercase text-[#20C6B6] font-semibold">
                        {msg.responseMeta.routing_mode.replace("_", " ")}
                      </span>
                      {msg.responseMeta.confidence !== undefined && (
                        <span>
                          Conf: {(msg.responseMeta.confidence * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Grounded Knowledge Sources Accordion */}
                  {msg.responseMeta?.sources && msg.responseMeta.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() =>
                          setExpandedSourcesId(
                            expandedSourcesId === msg.id ? null : msg.id
                          )
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-[#20C6B6] hover:underline"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>
                          {msg.responseMeta.sources.length} Grounded Source(s)
                        </span>
                        {expandedSourcesId === msg.id ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      {expandedSourcesId === msg.id && (
                        <div className="mt-1.5 space-y-1.5 bg-[#101A2B] p-2 rounded-lg border border-white/10 text-[11px]">
                          {msg.responseMeta.sources.map((src, sIdx) => (
                            <div key={sIdx} className="border-l-2 border-[#20C6B6] pl-2 py-0.5">
                              <div className="font-semibold text-white/90">
                                {src.title || src.source_id || "Knowledge Document"}
                              </div>
                              {src.snippet && (
                                <div className="text-white/60 italic text-[10px] mt-0.5">
                                  "{src.snippet}"
                                </div>
                              )}
                              {src.similarity !== undefined && (
                                <div className="text-[9px] text-[#20C6B6] font-mono mt-0.5">
                                  Similarity: {(src.similarity * 100).toFixed(1)}%
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Assistant Message Actions: Timestamp, TTS, Copy, Feedback */}
                {msg.sender === "assistant" && (
                  <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-white/40 font-mono">
                    <span>{msg.timestamp}</span>

                    {/* Half-Duplex Speech Playback */}
                    <SpeechPlaybackButton textToSpeak={msg.text} />

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="inline-flex items-center gap-0.5 hover:text-white transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {/* Feedback Trigger */}
                    {msg.responseMeta && !msg.feedbackGiven && (
                      <button
                        onClick={() =>
                          setActiveFeedbackMsgId(
                            activeFeedbackMsgId === msg.id ? null : msg.id
                          )
                        }
                        className="inline-flex items-center gap-0.5 text-amber-400/80 hover:text-amber-300 transition-colors"
                      >
                        <Star className="w-3 h-3" />
                        <span>Rate</span>
                      </button>
                    )}

                    {msg.feedbackGiven && (
                      <span className="text-emerald-400 inline-flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" />
                        Feedback recorded
                      </span>
                    )}
                  </div>
                )}

                {/* Inline Feedback Collector Widget */}
                {activeFeedbackMsgId === msg.id && !msg.feedbackGiven && (
                  <div className="w-full mt-2 p-2.5 bg-[#17263D] border border-white/10 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 font-semibold text-[11px]">
                        How accurate was this response?
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((starVal) => (
                          <button
                            key={starVal}
                            onClick={() => setRating(starVal)}
                            className="p-0.5 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                starVal <= rating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-white/20"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/60">Was this helpful?</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setHelpful(true)}
                          className={`p-1 rounded flex items-center gap-1 ${
                            helpful
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "text-white/40 hover:text-white"
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>Yes</span>
                        </button>
                        <button
                          onClick={() => setHelpful(false)}
                          className={`p-1 rounded flex items-center gap-1 ${
                            !helpful
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : "text-white/40 hover:text-white"
                          }`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                          <span>No</span>
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Optional comment or clarification..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-[#101A2B] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#456BFA]"
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setActiveFeedbackMsgId(null)}
                        className="px-2 py-0.5 text-white/50 hover:text-white text-[11px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmitFeedback(msg)}
                        disabled={isSubmittingFeedback}
                        className="px-3 py-1 bg-[#456BFA] hover:bg-[#3256e6] text-white font-medium rounded-lg text-[11px] shadow-sm flex items-center gap-1"
                      >
                        {isSubmittingFeedback ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Submit Feedback"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-white/60 text-xs italic">
                <Loader2 className="w-4 h-4 animate-spin text-[#20C6B6]" />
                <span>RELAY AI is reasoning...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
          <div className="p-3 border-t border-white/10 bg-[#17263D] flex items-center gap-2">
            {/* Half-Duplex Voice Input Button */}
            <VoiceInputButton
              onTranscribed={(spokenText) => {
                setInputMessage(spokenText);
                handleSendMessage(spokenText);
              }}
              disabled={isLoading}
            />

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                activeTab === "product_guide"
                  ? "Ask about models, datasets, or architecture..."
                  : "Type a customer support query..."
              }
              className="flex-1 bg-[#101A2B] border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#456BFA]"
              disabled={isLoading}
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="p-2 rounded-xl bg-[#456BFA] hover:bg-[#3256e6] disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm transition-all"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
