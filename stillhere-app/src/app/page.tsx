"use client";

import { useEffect, useMemo, useState } from "react";
import { Cormorant_Garamond, Manrope } from "next/font/google";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

type Message = {
  role: "user" | "stillhere";
  text: string;
};

type Signup = {
  name: string;
  email: string;
  source: string;
  createdAt: string;
};

type MoodEntry = {
  mood: string;
  note: string;
  createdAt: string;
};

type JournalEntry = {
  text: string;
  createdAt: string;
};

const typedPhrases = [
  "when you go quiet",
  "when the room gets loud",
  "when you feel behind",
  "before the spiral starts",
  "when one small step is enough",
];

const promptChips = [
  "I feel behind today",
  "I need a reset",
  "I can't focus",
  "I feel alone",
];

const moodOptions = [
  "Steady",
  "Hopeful",
  "Focused",
  "Heavy",
  "Anxious",
  "Tired",
];

const cinematicChats = [
  {
    speaker: "StillHere",
    side: "left",
    text: "A quiet day can mean more than silence. It can mean someone is carrying too much alone.",
  },
  {
    speaker: "Student",
    side: "right",
    text: "I usually disappear when I'm overwhelmed. I don't know how to explain it.",
  },
  {
    speaker: "StillHere",
    side: "left",
    text: "Then the product should not demand a perfect explanation. It should offer a softer first step.",
  },
  {
    speaker: "Reasoning",
    side: "left",
    text: "StillHere responds with journaling, breathing, mood check-ins, and one clear next action instead of empty positivity.",
  },
];

function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function getReply(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("behind")) {
    return "You are not late to your own life. Let us make the next 15 minutes simple: one task, one timer, one small win.";
  }

  if (lower.includes("focus") || lower.includes("school")) {
    return "Try shrinking the moment. Close the extra tabs, choose one thing, and work beside me for just a short stretch.";
  }

  if (lower.includes("alone") || lower.includes("lonely")) {
    return "I am glad you said that honestly. You do not have to perform being okay here. One small message to someone safe can count as progress.";
  }

  if (lower.includes("reset") || lower.includes("anxious")) {
    return "Let us slow everything down. Inhale for 4, hold for 2, exhale for 6. Three times. Then pick one thing you can control next.";
  }

  return "You do not need the perfect words. Start with the truest sentence you have, and we will make the rest smaller together.";
}

export default function Home() {
  const [typedIndex, setTypedIndex] = useState(0);
  const [typedCount, setTypedCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const [activePanel, setActivePanel] = useState<
    "companion" | "mood" | "journal" | "tracking"
  >("companion");

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "stillhere",
      text: "StillHere is open. No performance needed. What is the honest version of today?",
    },
  ]);

  const [chatInput, setChatInput] = useState("");

  const [signups, setSignups] = useState<Signup[]>([]);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupSource, setSignupSource] = useState("Website");
  const [signupStatus, setSignupStatus] = useState("");

  const [mood, setMood] = useState("Steady");
  const [moodNote, setMoodNote] = useState("");
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);

  const [journalText, setJournalText] = useState("");
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  const [copied, setCopied] = useState(false);

  const currentPhrase = typedPhrases[typedIndex];
  const visiblePhrase = currentPhrase.slice(0, typedCount);

  useEffect(() => {
    const delay = deleting ? 52 : 96;

    const timer = window.setTimeout(() => {
      if (!deleting && typedCount < currentPhrase.length) {
        setTypedCount((value) => value + 1);
        return;
      }

      if (!deleting && typedCount === currentPhrase.length) {
        window.setTimeout(() => setDeleting(true), 1600);
        return;
      }

      if (deleting && typedCount > 0) {
        setTypedCount((value) => value - 1);
        return;
      }

      setDeleting(false);
      setTypedIndex((value) => (value + 1) % typedPhrases.length);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [typedCount, deleting, currentPhrase.length]);

  useEffect(() => {
    setSignups(loadLocal<Signup[]>("stillhere_signups_v3", []));
    setMoodEntries(loadLocal<MoodEntry[]>("stillhere_moods_v3", []));
    setJournalEntries(loadLocal<JournalEntry[]>("stillhere_journals_v3", []));
  }, []);

  useEffect(() => saveLocal("stillhere_signups_v3", signups), [signups]);
  useEffect(() => saveLocal("stillhere_moods_v3", moodEntries), [moodEntries]);
  useEffect(() => saveLocal("stillhere_journals_v3", journalEntries), [journalEntries]);

  useEffect(() => {
    const items = document.querySelectorAll("[data-reveal], [data-chat]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.16 }
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  const totalActions =
    messages.filter((message) => message.role === "user").length +
    moodEntries.length +
    journalEntries.length;

  const steadyScore = useMemo(() => {
    if (moodEntries.length === 0) return 0;
    const positive = moodEntries.filter((entry) =>
      ["Steady", "Hopeful", "Focused"].includes(entry.mood)
    ).length;

    return Math.round((positive / moodEntries.length) * 100);
  }, [moodEntries]);

  function scrollToId(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function sendMessage(text?: string) {
    const clean = (text ?? chatInput).trim();
    if (!clean) return;

    setMessages((current) => [...current, { role: "user", text: clean }]);
    setChatInput("");

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        { role: "stillhere", text: getReply(clean) },
      ]);
    }, 520);
  }

  function addMood() {
    const entry: MoodEntry = {
      mood,
      note: moodNote.trim() || "No note added.",
      createdAt: new Date().toISOString(),
    };

    setMoodEntries((current) => [entry, ...current]);
    setMoodNote("");
  }

  function addJournal() {
    const clean = journalText.trim();
    if (!clean) return;

    const entry: JournalEntry = {
      text: clean,
      createdAt: new Date().toISOString(),
    };

    setJournalEntries((current) => [entry, ...current]);
    setJournalText("");
  }

  function addSignup() {
    const email = signupEmail.trim().toLowerCase();

    if (!email.includes("@") || !email.includes(".")) {
      setSignupStatus("Please enter a valid email address.");
      return;
    }

    if (signups.some((signup) => signup.email === email)) {
      setSignupStatus("That email is already on the list.");
      return;
    }

    const entry: Signup = {
      name: signupName.trim() || "Early user",
      email,
      source: signupSource,
      createdAt: new Date().toISOString(),
    };

    setSignups((current) => [entry, ...current]);
    setSignupName("");
    setSignupEmail("");
    setSignupSource("Website");
    setSignupStatus("You're in. StillHere saved your early-access signup.");
  }

  async function copyEmails() {
    await navigator.clipboard.writeText(
      signups.map((signup) => signup.email).join(", ")
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1300);
  }

  function exportCsv() {
    const header = "name,email,source,createdAt\n";
    const rows = signups
      .map(
        (signup) =>
          `"${signup.name}","${signup.email}","${signup.source}","${signup.createdAt}"`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "stillhere-waitlist.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className={`${bodyFont.className} min-h-screen overflow-hidden bg-[#060812] text-white`}>
      <style>{`
        html {
          scroll-behavior: smooth;
        }

        body {
          background: #060812;
        }

        .aurora-base {
          background:
            radial-gradient(circle at 18% 18%, rgba(88, 166, 255, 0.26), transparent 30%),
            radial-gradient(circle at 78% 20%, rgba(168, 85, 247, 0.22), transparent 34%),
            radial-gradient(circle at 52% 85%, rgba(45, 212, 191, 0.12), transparent 32%);
          animation: auroraShift 16s ease-in-out infinite alternate;
        }

        .vignette {
          background:
            radial-gradient(circle at center, transparent 38%, rgba(6,8,18,.35) 75%, rgba(6,8,18,.72) 100%);
        }

        .grid-soft {
          background-image:
            linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(circle at center, black 0%, transparent 76%);
        }

        .float-one {
          animation: floatOne 11s ease-in-out infinite;
        }

        .float-two {
          animation: floatTwo 13s ease-in-out infinite;
        }

        .pulse-heart {
          animation: heartPulse 2s ease-in-out infinite;
        }

        .beam {
          position: absolute;
          inset: auto;
          width: 34rem;
          height: 34rem;
          filter: blur(100px);
          opacity: .22;
          border-radius: 9999px;
          animation: drift 14s ease-in-out infinite alternate;
        }

        .shine {
          background-size: 200% 100%;
          animation: shimmer 5s linear infinite;
        }

        [data-reveal] {
          opacity: 0;
          transform: translateY(34px) scale(.985);
          transition: opacity .9s ease, transform .9s ease;
        }

        [data-reveal].is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        [data-chat] {
          opacity: 0;
          transform: translateY(28px);
        }

        [data-chat].is-visible.chat-left {
          animation: chatInLeft .8s cubic-bezier(.2,.8,.2,1) forwards;
        }

        [data-chat].is-visible.chat-right {
          animation: chatInRight .8s cubic-bezier(.2,.8,.2,1) forwards;
        }

        .typing-dots span {
          animation: blinkUp 1.2s infinite ease-in-out;
          display: inline-block;
        }

        .typing-dots span:nth-child(2) {
          animation-delay: .16s;
        }

        .typing-dots span:nth-child(3) {
          animation-delay: .32s;
        }

        @keyframes auroraShift {
          0% {
            transform: scale(1) translate3d(0,0,0);
            filter: saturate(1);
          }
          100% {
            transform: scale(1.08) translate3d(0,-8px,0);
            filter: saturate(1.3);
          }
        }

        @keyframes floatOne {
          0%, 100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(18px,-26px,0); }
        }

        @keyframes floatTwo {
          0%, 100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(-16px,-32px,0); }
        }

        @keyframes heartPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 28px rgba(96,165,250,.18);
          }
          50% {
            transform: scale(1.06);
            box-shadow: 0 0 65px rgba(168,85,247,.36);
          }
        }

        @keyframes drift {
          0% { transform: translate3d(0,0,0) scale(1); }
          100% { transform: translate3d(24px,-18px,0) scale(1.08); }
        }

        @keyframes shimmer {
          from { background-position: 0% 50%; }
          to { background-position: 200% 50%; }
        }

        @keyframes chatInLeft {
          0% {
            opacity: 0;
            transform: translateX(-28px) translateY(18px);
          }
          100% {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
        }

        @keyframes chatInRight {
          0% {
            opacity: 0;
            transform: translateX(28px) translateY(18px);
          }
          100% {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
        }

        @keyframes blinkUp {
          0%, 80%, 100% {
            opacity: .4;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="aurora-base absolute inset-0" />
        <div className="grid-soft absolute inset-0 opacity-30" />
        <div className="vignette absolute inset-0" />

        <div className="beam left-[6%] top-[10%] bg-cyan-400/35" />
        <div className="beam right-[4%] top-[20%] bg-violet-500/30" />
        <div className="float-one absolute left-[8%] top-[20%] h-72 w-72 rounded-full bg-cyan-400/16 blur-[110px]" />
        <div className="float-two absolute right-[12%] top-[28%] h-[26rem] w-[26rem] rounded-full bg-purple-500/16 blur-[130px]" />
      </div>

      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#060812]/68 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <button onClick={() => scrollToId("hero")} className="flex items-center gap-3">
            <div className="pulse-heart grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10">
              <span className="text-lg">♡</span>
            </div>
            <div className="text-left">
              <p className="text-lg font-extrabold tracking-tight">StillHere</p>
              <p className="text-xs text-white/45">human-first AI support</p>
            </div>
          </button>

          <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] p-1 md:flex">
            {[
              ["story", "story"],
              ["cinema", "cinema"],
              ["experience", "experience"],
              ["waitlist", "waitlist"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => scrollToId(id)}
                className="rounded-full px-4 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollToId("waitlist")}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-black transition hover:scale-105"
          >
            Join early access
          </button>
        </div>
      </nav>

      <section
        id="hero"
        className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-14 px-5 pb-20 pt-32 lg:grid-cols-[1.02fr_.98fr]"
      >
        <div data-reveal>
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,.9)]" />
            Built for the moments people usually hide
          </div>

          <h1
            className={`${displayFont.className} max-w-5xl text-5xl leading-[.9] tracking-[-0.05em] md:text-7xl lg:text-[7rem]`}
          >
            Use this
            <span className="block bg-gradient-to-r from-cyan-200 via-blue-200 to-violet-300 bg-clip-text text-transparent shine">
              {visiblePhrase}
              <span className="text-white">|</span>
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/66 md:text-xl">
            StillHere is a calm digital companion for check-ins, journaling, mood
            patterns, and small next steps. It is not built to overwhelm people.
            It is built to gently help them return to themselves.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => {
                setActivePanel("companion");
                scrollToId("experience");
              }}
              className="rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-7 py-4 font-extrabold text-white shadow-[0_0_60px_rgba(59,130,246,.34)] transition hover:scale-[1.03]"
            >
              Open the companion
            </button>
            <button
              onClick={() => scrollToId("story")}
              className="rounded-2xl border border-white/15 bg-white/[0.08] px-7 py-4 font-extrabold text-white backdrop-blur-xl transition hover:scale-[1.03] hover:bg-white/[0.12]"
            >
              Why it matters
            </button>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {[
              ["Private", "journal support"],
              ["Gentle", "daily check-ins"],
              ["Trackable", "early access"],
            ].map(([top, bottom]) => (
              <div
                key={top}
                className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl"
              >
                <p className="text-xl font-extrabold">{top}</p>
                <p className="mt-1 text-sm text-white/45">{bottom}</p>
              </div>
            ))}
          </div>
        </div>

        <div data-reveal className="relative">
          <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-violet-600/25 blur-3xl" />

          <div className="relative rounded-[2.5rem] border border-white/14 bg-white/[0.07] p-4 shadow-2xl backdrop-blur-2xl">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f1325]/92">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[.26em] text-white/35">
                    live companion
                  </p>
                  <p className="text-lg font-extrabold">StillHere Session</p>
                </div>
                <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
                  grounded
                </div>
              </div>

              <div className="space-y-3 p-5">
                <div className="max-w-[86%] rounded-3xl rounded-tl-md bg-white/10 p-4 text-sm leading-6 text-white/74">
                  You have been quiet today. Would it help to talk, journal, or take
                  one small reset?
                </div>
                <div className="ml-auto max-w-[86%] rounded-3xl rounded-tr-md bg-gradient-to-r from-blue-500 to-violet-500 p-4 text-sm font-semibold">
                  I do not really know where to start.
                </div>
                <div className="max-w-[90%] rounded-3xl rounded-tl-md bg-white/10 p-4 text-sm leading-6 text-white/74">
                  Then we do not start everywhere. We start with one breath, one
                  sentence, and one clear next step.
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-white/10 p-4">
                {["Talk", "Breathe", "Write"].map((label) => (
                  <button
                    key={label}
                    onClick={() => {
                      setActivePanel(label === "Write" ? "journal" : "companion");
                      scrollToId("experience");
                    }}
                    className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 text-sm text-white/68 transition hover:bg-white/12 hover:text-white"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute -bottom-8 -left-4 rounded-3xl border border-white/10 bg-[#12172b]/85 p-5 backdrop-blur-2xl">
            <p className="text-4xl font-black">{signups.length}</p>
            <p className="text-sm text-white/45">early users tracked</p>
          </div>
        </div>
      </section>

      <section id="story" className="relative z-10 mx-auto max-w-7xl px-5 py-24">
        <div className="grid gap-6 md:grid-cols-[.82fr_1.18fr]">
          <div data-reveal>
            <p className="text-sm font-extrabold uppercase tracking-[.35em] text-cyan-200">
              the point
            </p>
            <h2
              className={`${displayFont.className} mt-4 text-5xl leading-[.94] tracking-[-0.04em] md:text-7xl`}
            >
              A support system for the moments people usually hide.
            </h2>
          </div>

          <div
            data-reveal
            className="rounded-[2.5rem] border border-white/10 bg-white/[0.055] p-7 leading-8 text-white/66 backdrop-blur-xl md:text-lg"
          >
            StillHere is built around the quiet moments: missed texts, late-night
            stress, emotional shutdown, and the simple truth that not everyone knows
            how to ask for help in real time. The product is designed to make the
            first step feel smaller, safer, and more human.
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            [
              "Notice",
              "Recognize the quiet moments that often come before someone fully withdraws.",
            ],
            [
              "Ground",
              "Offer one gentle next step: breathing, writing, planning, or reaching out.",
            ],
            [
              "Remember",
              "Track patterns in mood and reflection so difficult seasons become more visible.",
            ],
          ].map(([title, text]) => (
            <div
              key={title}
              data-reveal
              className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-xl transition hover:-translate-y-2 hover:bg-white/[0.08]"
            >
              <div className="mb-8 h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-400 shadow-[0_0_40px_rgba(96,165,250,.3)]" />
              <h3 className="text-2xl font-extrabold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/55">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="cinema" className="relative z-10 mx-auto max-w-7xl px-5 py-24">
        <div className="mb-8" data-reveal>
          <p className="text-sm font-extrabold uppercase tracking-[.35em] text-violet-200">
            cinematic flow
          </p>
          <h2
            className={`${displayFont.className} mt-4 text-5xl leading-[.94] tracking-[-0.04em] md:text-7xl`}
          >
            The reasoning appears as a conversation.
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/62">
            As you scroll, the product story unfolds like a support thread. That way,
            the page does not just explain the idea — it feels like the idea.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[2.8rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl md:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/10" />

          <div className="relative mx-auto max-w-4xl space-y-4">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/60">
              <span className="typing-dots">
                <span>•</span> <span>•</span> <span>•</span>
              </span>
              Storyboard thread
            </div>

            {cinematicChats.map((item, index) => (
              <div
                key={index}
                data-chat
                className={`${
                  item.side === "right"
                    ? "chat-right ml-auto"
                    : "chat-left mr-auto"
                } max-w-[88%] rounded-[2rem] border border-white/10 p-5 backdrop-blur-xl`}
                style={{
                  transitionDelay: `${index * 180}ms`,
                  animationDelay: `${index * 180}ms`,
                  background:
                    item.side === "right"
                      ? "linear-gradient(135deg, rgba(59,130,246,0.82), rgba(139,92,246,0.82))"
                      : "rgba(255,255,255,0.06)",
                }}
              >
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p
                    className={`text-sm font-extrabold uppercase tracking-[.22em] ${
                      item.side === "right" ? "text-white/85" : "text-cyan-200"
                    }`}
                  >
                    {item.speaker}
                  </p>
                  <p
                    className={`text-xs ${
                      item.side === "right" ? "text-white/70" : "text-white/35"
                    }`}
                  >
                    Scene {index + 1}
                  </p>
                </div>

                <p
                  className={`text-base leading-8 ${
                    item.side === "right" ? "text-white" : "text-white/72"
                  }`}
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="experience" className="relative z-10 mx-auto max-w-7xl px-5 py-24">
        <div
          data-reveal
          className="rounded-[2.8rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-2xl md:p-6"
        >
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[.35em] text-violet-200">
                product experience
              </p>
              <h2
                className={`${displayFont.className} mt-3 text-5xl leading-[.94] tracking-[-.04em] md:text-7xl`}
              >
                Soft in tone. Real in function.
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-3xl border border-white/10 bg-black/20 p-2 md:grid-cols-4">
              {[
                ["companion", "Companion"],
                ["mood", "Mood"],
                ["journal", "Journal"],
                ["tracking", "Tracking"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActivePanel(id as typeof activePanel)}
                  className={`rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                    activePanel === id
                      ? "bg-white text-black"
                      : "text-white/52 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[540px] rounded-[2.2rem] border border-white/10 bg-[#0b0f1e]/88 p-5 md:p-7">
            {activePanel === "companion" && (
              <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
                <div>
                  <h3 className="text-3xl font-extrabold tracking-[-.03em]">
                    Companion chat
                  </h3>
                  <p className="mt-3 text-white/56">
                    A grounded support flow with simple prompts and emotionally aware
                    responses.
                  </p>

                  <div className="mt-6 grid gap-3">
                    {promptChips.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => sendMessage(chip)}
                        className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-left text-sm text-white/66 transition hover:bg-white/[0.1] hover:text-white"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-black/25 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="font-extrabold">StillHere</p>
                      <p className="text-xs text-white/35">support thread</p>
                    </div>
                    <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                      active
                    </span>
                  </div>

                  <div className="h-[315px] space-y-3 overflow-y-auto pr-1">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`max-w-[88%] rounded-3xl p-4 text-sm leading-6 ${
                          message.role === "user"
                            ? "ml-auto rounded-tr-md bg-gradient-to-r from-blue-500 to-violet-500 font-semibold"
                            : "rounded-tl-md bg-white/10 text-white/72"
                        }`}
                      >
                        {message.text}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <input
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") sendMessage();
                      }}
                      placeholder="Say the honest thing..."
                      className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-cyan-200/40"
                    />
                    <button
                      onClick={() => sendMessage()}
                      className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-black transition hover:scale-105"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activePanel === "mood" && (
              <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
                <div>
                  <h3 className="text-3xl font-extrabold tracking-[-.03em]">
                    Mood check-in
                  </h3>
                  <p className="mt-3 text-white/56">
                    Capture emotional patterns without making the experience feel clinical.
                  </p>

                  <select
                    value={mood}
                    onChange={(event) => setMood(event.target.value)}
                    className="mt-6 w-full rounded-2xl border border-white/10 bg-[#151a30] px-5 py-4 outline-none"
                  >
                    {moodOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>

                  <textarea
                    value={moodNote}
                    onChange={(event) => setMoodNote(event.target.value)}
                    placeholder="What changed today?"
                    className="mt-3 min-h-[160px] w-full resize-none rounded-2xl border border-white/10 bg-white/[0.06] p-5 outline-none placeholder:text-white/30 focus:border-cyan-200/40"
                  />

                  <button
                    onClick={addMood}
                    className="mt-3 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-4 font-extrabold transition hover:scale-[1.02]"
                  >
                    Save check-in
                  </button>
                </div>

                <div className="space-y-3 rounded-[2rem] border border-white/10 bg-black/25 p-5">
                  {moodEntries.length === 0 && (
                    <p className="text-white/45">
                      No mood entries yet. Save one to activate the history.
                    </p>
                  )}

                  {moodEntries.slice(0, 6).map((entry, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-white/10 bg-white/[0.055] p-4"
                    >
                      <div className="flex justify-between gap-3">
                        <p className="font-extrabold">{entry.mood}</p>
                        <p className="text-xs text-white/35">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-white/55">{entry.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === "journal" && (
              <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
                <div>
                  <h3 className="text-3xl font-extrabold tracking-[-.03em]">
                    Quiet journal
                  </h3>
                  <p className="mt-3 text-white/56">
                    A place for thoughts that feel too messy to explain out loud.
                  </p>

                  <textarea
                    value={journalText}
                    onChange={(event) => setJournalText(event.target.value)}
                    placeholder="Write it imperfectly. That still counts."
                    className="mt-6 min-h-[280px] w-full resize-none rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 outline-none placeholder:text-white/30 focus:border-violet-200/40"
                  />

                  <button
                    onClick={addJournal}
                    className="mt-3 w-full rounded-2xl bg-white px-5 py-4 font-extrabold text-black transition hover:scale-[1.02]"
                  >
                    Save entry
                  </button>
                </div>

                <div className="space-y-3 rounded-[2rem] border border-white/10 bg-black/25 p-5">
                  {journalEntries.length === 0 && (
                    <p className="text-white/45">No journal entries yet.</p>
                  )}

                  {journalEntries.slice(0, 5).map((entry, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-white/10 bg-white/[0.055] p-4"
                    >
                      <p className="text-xs text-white/35">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/60">
                        {entry.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === "tracking" && (
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["Early users", signups.length, "emails collected"],
                  ["Interactions", totalActions, "tracked actions"],
                  ["Steady score", `${steadyScore}%`, "from mood history"],
                ].map(([title, value, label]) => (
                  <div
                    key={title}
                    className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6"
                  >
                    <p className="text-sm text-white/40">{title}</p>
                    <p className="mt-3 text-5xl font-black tracking-[-.05em]">
                      {value}
                    </p>
                    <p className="mt-2 text-sm text-white/45">{label}</p>
                  </div>
                ))}

                <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 md:col-span-3">
                  <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                      <p className="text-xl font-extrabold">Email tracking</p>
                      <p className="text-sm text-white/45">
                        Stored locally for the MVP. Later, this can connect to Supabase.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={copyEmails}
                        className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-bold"
                      >
                        {copied ? "Copied" : "Copy emails"}
                      </button>
                      <button
                        onClick={exportCsv}
                        className="rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-black"
                      >
                        Export CSV
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-white/10">
                    <div className="grid grid-cols-4 bg-white/[0.08] px-4 py-3 text-xs font-extrabold uppercase tracking-widest text-white/35">
                      <span>Name</span>
                      <span>Email</span>
                      <span>Source</span>
                      <span>Date</span>
                    </div>

                    {signups.length === 0 && (
                      <div className="px-4 py-5 text-sm text-white/45">
                        No emails yet.
                      </div>
                    )}

                    {signups.slice(0, 8).map((signup) => (
                      <div
                        key={signup.email}
                        className="grid grid-cols-4 gap-2 border-t border-white/10 px-4 py-3 text-sm text-white/62"
                      >
                        <span className="truncate">{signup.name}</span>
                        <span className="truncate">{signup.email}</span>
                        <span className="truncate">{signup.source}</span>
                        <span className="truncate">
                          {new Date(signup.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="waitlist" className="relative z-10 mx-auto max-w-7xl px-5 py-24">
        <div
          data-reveal
          className="grid overflow-hidden rounded-[2.8rem] border border-white/10 bg-white/[0.06] backdrop-blur-2xl lg:grid-cols-[.9fr_1.1fr]"
        >
          <div className="border-b border-white/10 p-8 lg:border-b-0 lg:border-r">
            <p className="text-sm font-extrabold uppercase tracking-[.35em] text-cyan-200">
              early access
            </p>
            <h2
              className={`${displayFont.className} mt-4 text-5xl leading-[.94] tracking-[-.04em] md:text-7xl`}
            >
              Build around real people.
            </h2>
            <p className="mt-5 leading-8 text-white/60">
              Add users, track interest, and show recruiters this is more than a
              static visual — it is a functional product concept.
            </p>
          </div>

          <div className="p-8">
            <div className="grid gap-3">
              <input
                value={signupName}
                onChange={(event) => setSignupName(event.target.value)}
                placeholder="Name"
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 outline-none placeholder:text-white/30 focus:border-cyan-200/40"
              />
              <input
                value={signupEmail}
                onChange={(event) => setSignupEmail(event.target.value)}
                placeholder="Email address"
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 outline-none placeholder:text-white/30 focus:border-cyan-200/40"
              />
              <select
                value={signupSource}
                onChange={(event) => setSignupSource(event.target.value)}
                className="rounded-2xl border border-white/10 bg-[#151a30] px-5 py-4 outline-none"
              >
                <option>Website</option>
                <option>Friend</option>
                <option>Instagram</option>
                <option>LinkedIn</option>
                <option>McMaster</option>
              </select>

              <button
                onClick={addSignup}
                className="rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-5 py-4 font-extrabold shadow-[0_0_60px_rgba(59,130,246,.32)] transition hover:scale-[1.02]"
              >
                Join StillHere
              </button>

              {signupStatus && (
                <p className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-white/66">
                  {signupStatus}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-24">
        <div data-reveal className="mb-8">
          <p className="text-sm font-extrabold uppercase tracking-[.35em] text-violet-200">
            co-op value
          </p>
          <h2
            className={`${displayFont.className} mt-4 text-5xl leading-[.94] tracking-[-.04em] md:text-7xl`}
          >
            Why this feels internship-worthy.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            [
              "Frontend system",
              "A responsive Next.js product with polished visuals, motion, state, and user interaction.",
            ],
            [
              "Data layer",
              "Waitlist, mood history, and journal entries are stored for the MVP and ready for a database upgrade.",
            ],
            [
              "AI direction",
              "The support flow already behaves like a thoughtful product, and can later connect to a real AI backend.",
            ],
          ].map(([title, text]) => (
            <div
              key={title}
              data-reveal
              className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-xl"
            >
              <h3 className="text-2xl font-extrabold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/55">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-5 py-8 text-center text-sm text-white/40">
        StillHere is a student-built wellness support MVP. It is not a crisis
        service or a replacement for professional care.
      </footer>
    </main>
  );
}