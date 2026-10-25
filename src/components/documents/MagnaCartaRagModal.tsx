"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  ExternalLink, 
  X, 
  ChevronRight, 
  FileText, 
  ShieldCheck, 
  Compass, 
  Scale, 
  HelpCircle,
  Copy,
  Check,
  Send,
  Loader2,
  Maximize2,
  Bookmark,
  AlertTriangle
} from "lucide-react";
import { 
  articles, 
  askMagnaCartaCounsel, 
  searchMagnaCarta, 
  RagResponse, 
  MagnaArticle, 
  BASE_SOURCE_URL 
} from "@/lib/magnaCartaRag";

interface MagnaCartaRagModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function MagnaCartaRagModal({
  isOpen,
  onClose,
  initialQuery = "",
}: MagnaCartaRagModalProps) {
  const [activeTab, setActiveTab] = useState<"rag" | "articles">("rag");
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [ragResult, setRagResult] = useState<RagResponse | null>(() => 
    initialQuery ? askMagnaCartaCounsel(initialQuery) : null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [articleFilter, setArticleFilter] = useState("");
  const [copiedText, setCopiedText] = useState(false);

  React.useEffect(() => {
    if (isOpen && initialQuery) {
      setQueryInput(initialQuery);
      setRagResult(askMagnaCartaCounsel(initialQuery));
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  // Handle RAG Ask Submission
  const handleAsk = (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setQueryInput(query);
    setTimeout(() => {
      const res = askMagnaCartaCounsel(query);
      setRagResult(res);
      setIsSearching(false);
    }, 350);
  };

  const handleCopyCitation = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const filteredArticles = articleFilter.trim()
    ? searchMagnaCarta(articleFilter).map((r) => r.article)
    : articles;

  const quickQuestions = [
    "What are the qualifications and rights of an Eagle Member?",
    "What is the quorum requirement for chapter and assembly meetings?",
    "How are national dues and club contributions allocated and audited?",
    "What are the grounds and procedures for member suspension or expulsion?",
    "What are the official rules on the Eagle Gong, Gavel, and Insignia?",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/15 p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 dark:text-white">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-2xl bg-slate-900 border border-amber-400 p-1 shadow-md flex items-center justify-center shrink-0">
              <Image
                src="/assets/BEEC_official_crest.jpg"
                alt="TFOE-PE Seal"
                width={44}
                height={44}
                className="object-contain"
                unoptimized
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-black text-lg text-slate-900 dark:text-white tracking-tight">
                  Philippine Eagles Magna Carta & Constitution
                </h3>
                <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/20">
                  Edition 2024
                </span>
                <span className="text-[10px] bg-blue-500/10 text-eagle-blue dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Search Assistant
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Official Supreme Law of The Fraternal Order of Eagles • Philippine Eagles, Inc.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={BASE_SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-xs font-bold text-eagle-blue dark:text-amber-300 transition"
              title="Open Official e-Constitution Portal"
            >
              <span>e-Constitution Portal</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-slate-300 transition"
              title="Close Modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 my-4 border border-slate-200/80 dark:border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("rag")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "rag"
                ? "bg-white dark:bg-canvas-dark text-eagle-blue dark:text-amber-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" /> Constitutional Search Assistant (RAG)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("articles")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "articles"
                ? "bg-white dark:bg-canvas-dark text-eagle-blue dark:text-amber-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BookOpen className="h-4 w-4 text-blue-500" /> Browse All 21 Articles ({articles.length})
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: RAG AI FRATERNAL COUNSEL                                */}
        {/* ============================================================== */}
        {activeTab === "rag" && (
          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            {/* Search Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk(queryInput);
              }}
              className="relative"
            >
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Ask any question about Magna Carta, quorum, dues, discipline, membership, PEIL..."
                  className="w-full pl-11 pr-28 py-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/15 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-eagle-blue shadow-inner"
                />
                <button
                  type="submit"
                  disabled={isSearching || !queryInput.trim()}
                  className="absolute right-2 px-4 py-2 rounded-xl bg-gradient-to-r from-eagle-blue to-eagle-blue-dark text-white text-xs font-bold shadow hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5 transition active:scale-95"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" /> Ask Counsel
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Question Chips */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-2">
                Frequently Consulted Constitutional Topics:
              </span>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAsk(q)}
                    className="text-[11px] text-left px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 font-medium transition hover:border-amber-400/50"
                  >
                    💬 {q}
                  </button>
                ))}
              </div>
            </div>

            {/* RAG Answer Display Card */}
            {ragResult ? (
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-amber-50/20 dark:from-canvas-slate dark:via-[#0f172a] dark:to-canvas-dark border border-amber-400/40 shadow-xl space-y-4 animate-fadeIn">
                
                {/* Header & Source Authority Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <Scale className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                        Magna Carta Constitutional Counsel
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Corpus: The Philippine Eagles Constitution of 2024 (Ratified Oct 2024)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {ragResult.isAbstained ? (
                      <span className="text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-500" /> Insufficient Evidence (Abstained)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> {ragResult.confidence} Evidence Match
                      </span>
                    )}
                  </div>
                </div>

                {/* Safeguard Alert: Explicit Abstention */}
                {ragResult.isAbstained && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Constitutional Safeguard — Evidence Abstention</span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                      {ragResult.abstainReason || "This inquiry could not be matched with high certainty to the ratified 2024 Philippine Eagles Constitution. Agila Hub AI strictly avoids fabricating legal interpretations or unratified rules."}
                    </p>
                  </div>
                )}

                {/* SECTION 1: Fraternal Synthesis / AI Explanation */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-eagle-blue dark:text-amber-400" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Fraternal Synthesis & Explanation:
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/80 dark:bg-canvas-dark/60 border border-slate-200/80 dark:border-white/10 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line shadow-sm">
                    {ragResult.answer}
                  </div>
                </div>

                {/* SECTION 2: Direct Verbatim Excerpt (Primary Ratified Source) */}
                {(ragResult.directQuotation || (ragResult.citations.length > 0 && ragResult.citations[0].excerpt)) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bookmark className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          Direct Verbatim Excerpt (Primary Ratified Source):
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {ragResult.citations[0]?.document_version || "2024 Ratified Edition"}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-400/5 border-l-4 border-l-amber-500 border border-slate-200 dark:border-white/10 shadow-sm space-y-2">
                      <p className="text-xs sm:text-sm font-serif italic text-slate-800 dark:text-slate-200 leading-relaxed">
                        &ldquo;{ragResult.directQuotation || ragResult.citations[0].excerpt}&rdquo;
                      </p>
                      {ragResult.citations.length > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-sans pt-1 border-t border-slate-200/50 dark:border-white/5">
                          <span>
                            — <strong>{ragResult.citations[0].article_number}</strong>: {ragResult.citations[0].article_title} ({ragResult.citations[0].page_range})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCitation(ragResult.directQuotation || ragResult.citations[0].excerpt)}
                            className="text-eagle-blue dark:text-amber-300 font-bold hover:underline flex items-center gap-1"
                          >
                            {copiedText ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedText ? "Copied" : "Copy Verbatim"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Citations Grid */}
                {ragResult.citations.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 dark:border-white/10">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2.5">
                      Corpus Citations & Verification:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ragResult.citations.map((cite, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-2xl bg-white dark:bg-canvas-dark border border-slate-200 dark:border-white/10 shadow-sm space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                              {cite.article_number}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {cite.page_range}
                            </span>
                          </div>
                          <h5 className="font-display font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                            {cite.article_title}
                          </h5>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 italic line-clamp-3 bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-200/50 dark:border-white/5">
                            "{cite.excerpt}"
                          </p>
                          <div className="pt-1 flex items-center justify-between text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleCopyCitation(`${cite.article_title} (${cite.page_range})\n${cite.excerpt}`)}
                              className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-semibold flex items-center gap-1"
                            >
                              {copiedText ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-500" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" /> Copy Citation
                                </>
                              )}
                            </button>
                            <a
                              href={cite.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-eagle-blue dark:text-amber-300 font-bold hover:underline flex items-center gap-0.5"
                            >
                              Open in e-Constitution →
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer banner */}
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Notice: </span>
                  {ragResult.disclaimer}
                </div>

                {/* Follow-up suggestions */}
                {ragResult.suggestedQueries.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">
                      Related Inquiries:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ragResult.suggestedQueries.map((sq, k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => handleAsk(sq)}
                          className="text-[10px] text-eagle-blue dark:text-amber-300 hover:underline font-semibold"
                        >
                          → {sq}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 text-center space-y-3">
                <Compass className="h-12 w-12 text-slate-400 mx-auto" />
                <h4 className="font-display font-extrabold text-base text-slate-800 dark:text-white">
                  Constitutional Search & Reference Assistant
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Type any fraternal inquiry or select a topic above. Our retrieval engine searches across all 326 pages of the 2024 Philippine Eagles Constitution and By-Laws to provide source excerpts and article citations for study.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: BROWSE ALL 21 ARTICLES                                  */}
        {/* ============================================================== */}
        {activeTab === "articles" && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Filter Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={articleFilter}
                onChange={(e) => setArticleFilter(e.target.value)}
                placeholder="Filter articles by title, subject, or keyword (e.g. elections, dues, PEIL, tribunal)..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-eagle-blue"
              />
            </div>

            {/* Articles List */}
            <div className="space-y-3">
              {filteredArticles.map((art) => {
                const isExpanded = expandedArticleId === art.id;
                return (
                  <div
                    key={art.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 hover:border-amber-400/50 transition shadow-sm space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                            {art.number}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold bg-slate-200 dark:bg-white/10 px-1.5 py-0.2 rounded">
                            {art.page_range}
                          </span>
                        </div>
                        <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                          {art.title}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedArticleId(isExpanded ? null : art.id)}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold text-eagle-blue dark:text-amber-300 hover:bg-slate-100 transition shrink-0"
                      >
                        {isExpanded ? "Collapse" : "Read Full Article"}
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {art.summary}
                    </p>

                    {/* Expandable Full Article Text */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 space-y-3 animate-fadeIn">
                        <div className="max-h-72 overflow-y-auto p-3.5 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-300">
                          {art.content}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("rag");
                              handleAsk(`What does ${art.number} state regarding ${art.title}?`);
                            }}
                            className="font-bold text-eagle-blue dark:text-amber-300 hover:underline flex items-center gap-1"
                          >
                            <Sparkles className="h-3.5 w-3.5" /> Ask AI Counsel about this Article
                          </button>
                          <a
                            href={BASE_SOURCE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1"
                          >
                            View on e-Constitution <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Source: <strong>https://e-constitution.tfoe-peinc.com/</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
