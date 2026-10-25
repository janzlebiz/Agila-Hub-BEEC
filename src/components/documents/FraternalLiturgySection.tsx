"use client";

import React, { useState } from "react";
import { 
  BookOpen, 
  Scroll, 
  Music, 
  Heart, 
  ShieldCheck, 
  Copy, 
  Check, 
  Sparkles,
  Flame,
  Award
} from "lucide-react";

export function FraternalLiturgySection() {
  const [activeTab, setActiveTab] = useState<"acronym" | "eagleism" | "prayer" | "hymn" | "pledge">("acronym");
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const eaglesLetters = [
    {
      letter: "E",
      title: "Enlightened and Innovative Humanitarian",
      desc: "Enlightened and innovative humanitarian",
      color: "from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500",
    },
    {
      letter: "A",
      title: "Animated primarily by Brotherhood",
      desc: "Animated primarily by a strong bond of brotherhood and fraternal ties",
      color: "from-amber-500 to-yellow-500 dark:from-amber-400 dark:to-yellow-400",
    },
    {
      letter: "G",
      title: "God-Loving",
      desc: "God-loving, non sectarian",
      color: "from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500",
    },
    {
      letter: "L",
      title: "Law-Abiding",
      desc: "Law-abiding, liberty-oriented, non-political",
      color: "from-purple-600 to-violet-600 dark:from-purple-500 dark:to-violet-500",
    },
    {
      letter: "E",
      title: "Emblazed with Intense Mission",
      desc: "Emblazed with intense mission of sharing human care",
      color: "from-rose-600 to-red-600 dark:from-rose-500 dark:to-red-500",
    },
    {
      letter: "S",
      title: "Service to Country & Community",
      desc: "Service to country, its people and its community",
      color: "from-amber-600 to-orange-600 dark:from-amber-500 dark:to-orange-500",
    },
  ];

  const ecumenicalPrayerText = `Our Divine Providence, we humble ourselves before you as we praise your Holy Name and feel your presence in our midst.

We implore your Divine Guidance and Blessing as we consciously gather on this occasion in pursuit and furtherance of the cherished goals and objectives of our beloved Fraternity.

We beseech you, All Powerful God, to enrich our hearts, to enlighten our minds, and to broaden our understanding and compassion to one another as we carry and pursue our goals and objectives not only on this particular occasion but also on the many times of our striving and endeavors.

Please, Almighty God, elevate our spirits and fortify our steps, as we seek to keep and edify our Fraternity everyone and whole and as we strive perseveringly to enhance and strengthen our national brotherhood.

All these, our Divine Providence, we fervently ask under your supreme guidance and direction.

Amen.`;

  const hymnLyrics = `God-loving men for country’s sake
Offers strength and mind and energy
We dedicate fraternal love
Service for the good of all humanity.

[CHORUS]
We’re Eagles, the Philippines Eagles;
Lasting peace’s our noble mission;
We’re Eagles, friend to all people;
Pillars of the Nation.

For brotherhood we work and serve
Peace, Equality and Unity
Emblazed with zeal of human care,
We will share our lives to keep our liberty.`;

  const pledgeText = `I, [State Your Name], having consciously subscribed to the Constitution and the Eagles Magna Carta of the Philippine Eagles, and aware of my responsibility to my GOD and COUNTRY, do hereby pledge to promote and defend at all times said Constitution and Magna Carta and their ideals to the best of my ability and within my power and capacity.

SO HELP ME GOD.`;

  return (
    <div className="rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-md space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
            <Scroll className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
              Fraternal Liturgy & Fundamental Principles
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The foundational prayers, doctrine, hymn, pledge, and meaning of EAGLES
            </p>
          </div>
        </div>
      </div>

      {/* Liturgy Navigation Pills */}
      <div className="flex rounded-2xl bg-slate-100 dark:bg-white/5 p-1 text-xs font-bold border border-slate-200 dark:border-white/10 overflow-x-auto no-scrollbar gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("acronym")}
          className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === "acronym"
              ? "bg-eagle-blue text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          <span>Meaning of EAGLES</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("eagleism")}
          className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === "eagleism"
              ? "bg-eagle-blue text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Eagleism</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("prayer")}
          className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === "prayer"
              ? "bg-eagle-blue text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Ecumenical Prayer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("hymn")}
          className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === "hymn"
              ? "bg-eagle-blue text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Music className="h-3.5 w-3.5" />
          <span>Eagles Hymn</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pledge")}
          className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === "pledge"
              ? "bg-eagle-blue text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Eagles Pledge</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. MEANING OF EAGLES (ACRONYM)                                  */}
      {/* ============================================================== */}
      {activeTab === "acronym" && (
        <div className="space-y-3 animate-fadeIn pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              The Six Fraternal Virtues of an Eagle:
            </span>
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
              E • A • G • L • E • S
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {eaglesLetters.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-start gap-3.5 transition hover:border-eagle-blue/50"
              >
                <div
                  className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${item.color} text-white font-display font-black text-xl flex items-center justify-center shrink-0 shadow-md`}
                >
                  {item.letter}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. EAGLEISM (PHILOSOPHY & DOCTRINE)                             */}
      {/* ============================================================== */}
      {activeTab === "eagleism" && (
        <div className="space-y-4 animate-fadeIn pt-1">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent border border-amber-400/30 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Flame className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h4 className="font-display font-black text-base">
                The Philosophy of Eagleism
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
              &ldquo;Eagleism is fraternalism, or that state of relationship characteristic of brothers. In the Philippine Eagles, members must have primordially developed a deep sense of brotherhood among them. The primacy of their relationship is brotherhood.&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 space-y-1.5">
              <span className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Heart className="h-4 w-4 text-red-500" /> True Fraternal Brotherhood
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Eagleism is fraternalism in action. It unites members past political, religious, or socioeconomic boundaries, binding every Eagle as brothers (Kuya) committed to mutual protection and fraternal welfare.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 space-y-1.5">
              <span className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" /> Humanitarian Stewardship
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Service is not routine charity; it is an obligation to uplifting the underprivileged, disaster-affected communities, and nation-building without personal fanfare or glory.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 space-y-1.5">
              <span className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> The Golden Rule
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                &ldquo;What you would have others do unto you, do ye even so unto them.&rdquo; Integrity, respect, honesty, and justice form the pillars of every Eagle&apos;s personal and public life.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 space-y-1.5">
              <span className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Award className="h-4 w-4 text-eagle-blue" /> Deo Et Patria
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                For God and Country. An Eagle places fidelity to Divine Providence and patriotism above self, working relentlessly for peace, equality, and national liberty.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. EAGLES ECUMENICAL PRAYER                                    */}
      {/* ============================================================== */}
      {activeTab === "prayer" && (
        <div className="space-y-3 animate-fadeIn pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              The Universal / Ecumenical Prayer of the Philippine Eagles
            </span>
            <button
              type="button"
              onClick={() => handleCopy(ecumenicalPrayerText, "prayer")}
              className="text-xs font-bold text-eagle-blue dark:text-amber-300 hover:underline flex items-center gap-1"
            >
              {copied === "prayer" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied Text
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy Prayer
                </>
              )}
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-serif leading-relaxed text-slate-800 dark:text-slate-200 text-xs sm:text-sm space-y-3 shadow-inner">
            <p className="italic">
              &ldquo;Our Divine Providence, we humble ourselves before you as we praise your Holy Name and feel your presence in our midst.
            </p>
            <p className="italic">
              We implore your Divine Guidance and Blessing as we consciously gather on this occasion in pursuit and furtherance of the cherished goals and objectives of our beloved Fraternity.
            </p>
            <p className="italic">
              We beseech you, All Powerful God, to enrich our hearts, to enlighten our minds, and to broaden our understanding and compassion to one another as we carry and pursue our goals and objectives not only on this particular occasion but also on the many times of our striving and endeavors.
            </p>
            <p className="italic">
              Please, Almighty God, elevate our spirits and fortify our steps, as we seek to keep and edify our Fraternity everyone and whole and as we strive perseveringly to enhance and strengthen our national brotherhood.
            </p>
            <p className="italic">
              All these, our Divine Providence, we fervently ask under your supreme guidance and direction.
            </p>
            <p className="font-bold text-right font-sans not-italic text-amber-600 dark:text-amber-400">
              Amen.&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. EAGLES HYMN                                                 */}
      {/* ============================================================== */}
      {activeTab === "hymn" && (
        <div className="space-y-3 animate-fadeIn pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Official Hymn of The Fraternal Order of Eagles
            </span>
            <button
              type="button"
              onClick={() => handleCopy(hymnLyrics, "hymn")}
              className="text-xs font-bold text-eagle-blue dark:text-amber-300 hover:underline flex items-center gap-1"
            >
              {copied === "hymn" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied Lyrics
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy Hymn
                </>
              )}
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs sm:text-sm space-y-4 shadow-inner leading-relaxed">
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider mb-1">
                Verse 1
              </p>
              <p>God-loving men for country’s sake,</p>
              <p>Offers strength and mind and energy,</p>
              <p>We dedicate fraternal love,</p>
              <p>Service for the good of all humanity.</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-950 dark:text-amber-200 font-bold">
              <p className="text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">
                Chorus
              </p>
              <p>We’re Eagles, the Philippines Eagles;</p>
              <p>Lasting peace’s our noble mission;</p>
              <p>We’re Eagles, friend to all people;</p>
              <p>Pillars of the Nation.</p>
            </div>

            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider mb-1">
                Verse 2
              </p>
              <p>For brotherhood we work and serve,</p>
              <p>Peace, Equality and Unity,</p>
              <p>Emblazed with zeal of human care,</p>
              <p>We will share our lives to keep our liberty.</p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. EAGLES PLEDGE                                               */}
      {/* ============================================================== */}
      {activeTab === "pledge" && (
        <div className="space-y-3 animate-fadeIn pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              The Solemn Fraternal Pledge
            </span>
            <button
              type="button"
              onClick={() => handleCopy(pledgeText, "pledge")}
              className="text-xs font-bold text-eagle-blue dark:text-amber-300 hover:underline flex items-center gap-1"
            >
              {copied === "pledge" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied Pledge
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy Pledge
                </>
              )}
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-serif leading-relaxed text-slate-800 dark:text-slate-200 text-xs sm:text-sm space-y-4 shadow-inner">
            <div className="flex items-center gap-2 text-xs font-bold font-sans text-amber-600 dark:text-amber-400 mb-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Solemn Oath of Inducted Eagles</span>
            </div>
            <p className="italic">
              &ldquo;I, <span className="underline font-bold not-italic font-sans">[State Your Name]</span>, having consciously subscribed to the Constitution and the Eagles Magna Carta of the Philippine Eagles, and aware of my responsibility to my <strong>GOD</strong> and <strong>COUNTRY</strong>, do hereby pledge to promote and defend at all times said Constitution and Magna Carta and their ideals to the best of my ability and within my power and capacity.&rdquo;
            </p>
            <p className="font-display font-black text-sm not-italic font-sans text-right text-slate-900 dark:text-white tracking-wider">
              SO HELP ME GOD.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
