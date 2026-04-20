import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Cake, Gift, PartyPopper, Sparkles } from "lucide-react";
import { useTeamBirthdays, type TeamBirthdayUser } from "../../apis/api/auth";
import { getUserId } from "../../utils/auth";

const DISMISS_KEY_PREFIX = "birthday-popup-dismissed-";

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isBirthdayToday(dob: string | null | undefined) {
  if (!dob) return false;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function ageTurning(dob: string | null | undefined) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const beforeBirthday =
    now.getMonth() < d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() < d.getDate());
  if (beforeBirthday) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

/** Repeats an element N times with a staggered delay for CSS animations. */
const CONFETTI_COLORS = [
  "#f472b6", "#fb7185", "#facc15", "#a78bfa",
  "#60a5fa", "#34d399", "#fbbf24", "#f87171",
];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 32 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.5,
        duration: 2.8 + Math.random() * 2.2,
        rotate: Math.random() * 360,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.round(Math.random() * 6),
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block rounded-sm"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.6}px`,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `bday-fall ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Balloons() {
  const balloons = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        left: 8 + i * 15 + Math.random() * 4,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
        color: CONFETTI_COLORS[(i + 2) % CONFETTI_COLORS.length],
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32">
      {balloons.map((b) => (
        <span
          key={b.id}
          className="absolute block"
          style={{
            left: `${b.left}%`,
            bottom: "-20px",
            animation: `bday-float ${b.duration}s ease-in-out ${b.delay}s infinite`,
          }}
        >
          <svg width="22" height="30" viewBox="0 0 22 30" fill="none">
            <ellipse cx="11" cy="11" rx="9" ry="11" fill={b.color} />
            <path d="M11 22 L11 29" stroke="#334155" strokeWidth="0.8" />
            <path d="M9 21 L13 21 L11 24 Z" fill={b.color} />
          </svg>
        </span>
      ))}
    </div>
  );
}

const BirthdayPopup = () => {
  const myId = getUserId();
  const { data: users = [] } = useTeamBirthdays();

  const birthdayUsers = useMemo(
    () => users.filter((u) => isBirthdayToday(u.dob ?? null)),
    [users]
  );

  // Put the current user last so they see teammates first (happier UX).
  const queue = useMemo(() => {
    const others = birthdayUsers.filter((u) => u._id !== myId);
    const me = birthdayUsers.find((u) => u._id === myId);
    return me ? [...others, me] : others;
  }, [birthdayUsers, myId]);

  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(DISMISS_KEY_PREFIX + todayKey()) === "1";
  });

  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [cardVisible, setCardVisible] = useState(true);
  const EXIT_MS = 220;

  const current = !dismissed && queue.length > 0 ? queue[index] : null;
  const open = !!current;

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      requestAnimationFrame(() => setIsVisible(true));
      return;
    }
    setIsVisible(false);
    const t = window.setTimeout(() => setShouldRender(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY_PREFIX + todayKey(), "1");
    } catch {
      // ignore
    }
    setDismissed(true);
    setIndex(0);
  };

  const next = () => {
    if (index < queue.length - 1) {
      setCardVisible(false);
      window.setTimeout(() => {
        setIndex((i) => i + 1);
        setCardKey((k) => k + 1);
        setCardVisible(true);
      }, 160);
    } else {
      dismiss();
    }
  };

  if (!shouldRender || !current) return null;

  const isSelf = current._id === myId;
  const firstName = current.name.split(" ")[0];
  const age = ageTurning(current.dob ?? null);
  const total = queue.length;

  return createPortal(
    <>
      <style>{`
        @keyframes bday-fall {
          0%   { transform: translateY(-10%) rotate(0deg); }
          100% { transform: translateY(120vh) rotate(720deg); }
        }
        @keyframes bday-float {
          0%   { transform: translateY(0) translateX(0); }
          50%  { transform: translateY(-130px) translateX(10px); }
          100% { transform: translateY(-240px) translateX(-10px); opacity: 0; }
        }
        @keyframes bday-pop {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bday-wiggle {
          0%, 100% { transform: rotate(-6deg); }
          50%      { transform: rotate(6deg); }
        }
      `}</style>
      <div
        className="fixed inset-0 z-[320] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bday-popup-title"
      >
        <div
          className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={dismiss}
          aria-hidden
        />

        <div
          key={cardKey}
          className={`relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isVisible && cardVisible
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-4 scale-[0.96] opacity-0"
          }`}
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-fuchsia-500 to-orange-400 px-6 pb-20 pt-8 text-white">
            <Confetti />
            <Balloons />
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-white/20 blur-2xl" />

            <div className="relative flex flex-col items-center text-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full bg-white/25 backdrop-blur"
                style={{ animation: "bday-pop 600ms cubic-bezier(0.22,1,0.36,1) both" }}
              >
                <span
                  className="block"
                  style={{ animation: "bday-wiggle 1.6s ease-in-out infinite" }}
                >
                  <Cake className="h-10 w-10" />
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/85">
                <Sparkles className="h-3.5 w-3.5" />
                {isSelf ? "Happy Birthday!" : "Birthday alert"}
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <h2
                id="bday-popup-title"
                className="mt-2 text-2xl font-bold leading-tight"
              >
                {isSelf ? `Happy Birthday, ${firstName}!` : `It's ${firstName}'s Birthday!`}
              </h2>
              {age !== null && (
                <p className="mt-1 text-sm text-white/90">
                  {isSelf ? `You're turning ${age} today` : `${firstName} is turning ${age} today`}
                </p>
              )}
            </div>
          </div>

          <div className="-mt-10 rounded-t-3xl bg-white px-6 pb-6 pt-6">
            <div className="flex items-center gap-3">
              <BirthdayAvatar user={current} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {current.name}
                </p>
                <p className="truncate text-xs capitalize text-slate-500">
                  {Array.isArray(current.role) ? current.role[0] : current.role ?? "Team"}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-600">
                <PartyPopper className="h-3.5 w-3.5" />
                Today
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {isSelf
                ? "Wishing you a day filled with happiness and a year filled with joy. The whole team is cheering for you!"
                : `Drop ${firstName} a message in the team chat and make their day special.`}
            </p>

            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {total > 1 &&
                  Array.from({ length: total }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === index
                          ? "w-6 bg-pink-500"
                          : i < index
                          ? "w-1.5 bg-pink-300"
                          : "w-1.5 bg-slate-200"
                      }`}
                    />
                  ))}
                {total > 1 && (
                  <span className="ml-2 text-xs text-slate-400">
                    {index + 1} / {total}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                >
                  <Gift className="h-4 w-4 transition-transform group-hover:-rotate-12" />
                  {isSelf ? "Thanks!" : index < total - 1 ? "Next" : "Send wishes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

function BirthdayAvatar({ user }: { user: TeamBirthdayUser }) {
  if (user.profileImage) {
    return (
      <img
        src={user.profileImage}
        alt={user.name}
        className="h-11 w-11 flex-shrink-0 rounded-full object-cover ring-2 ring-pink-200"
      />
    );
  }
  return (
    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 text-sm font-semibold text-white ring-2 ring-pink-200">
      {user.name.charAt(0).toUpperCase()}
    </span>
  );
}

export default BirthdayPopup;
