"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Globe, Lock, X, Send, Loader2, MessageSquare, Pencil } from "lucide-react";

const EMOJIS = ["👍", "❤️", "🙏", "🎉", "🔥", "😮"];

type Reaction = {
  id: number;
  emoji: string;
  userId: string;
  userName: string;
};

type Broadcast = {
  id: number;
  title: string;
  message: string;
  isPublic: boolean;
  createdAt: string;
  authorName: string;
  authorRole: string;
  society: { id: number; name: string };
  reactions: Reaction[];
};

const societyColors: Record<string, { color: string; light: string }> = {
  ump:        { color: "#2563eb", light: "#eff6ff" },
  upa:        { color: "#d97706", light: "#fffbeb" },
  uph:        { color: "#ea580c", light: "#fff7ed" },
  saf:        { color: "#db2777", light: "#fdf2f8" },
  ucp:        { color: "#f59e0b", light: "#fefce8" },
  diaconia:   { color: "#0d9488", light: "#f0fdfa" },
  conselho:   { color: "#4f46e5", light: "#eef2ff" },
  ministerio: { color: "#16a34a", light: "#f0fdf4" },
  ebd:        { color: "#b45309", light: "#fffbeb" },
};

function groupReactions(reactions: Reaction[]) {
  const map: Record<string, { count: number; users: string[] }> = {};
  reactions.forEach((r) => {
    if (!map[r.emoji]) map[r.emoji] = { count: 0, users: [] };
    map[r.emoji].count++;
    map[r.emoji].users.push(r.userName);
  });
  return map;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "agora mesmo";
  if (mins < 60)  return `há ${mins}min`;
  if (hours < 24) return `há ${hours}h`;
  if (days < 7)   return `há ${days}d`;
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", timeZone: "America/Sao_Paulo"
  });
}

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
      style={{ background: color }}
    >
      {initials || "?"}
    </div>
  );
}

export default function BroadcastFeed({
  societyId,
  role,
  accentColor,
  showAll = false,
  exclusive = false,
}: {
  societyId: number | null;
  role: string;
  accentColor: string;
  showAll?: boolean;
  exclusive?: boolean;
}) {
  const { user } = useUser();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setBroadcasts([]);

    let url: string;
    if (showAll) {
      url = "/api/broadcasts";
    } else if (societyId) {
      url = `/api/broadcasts?societyId=${societyId}&exclusive=${exclusive}`;
    } else {
      url = "/api/broadcasts";
    }

    fetch(url)
      .then(async (r) => {
        const text = await r.text();
        if (!text) return [];
        try { return JSON.parse(text); }
        catch { console.error("Broadcasts API:", text); return []; }
      })
      .then(setBroadcasts)
      .finally(() => setLoading(false));
  }, [societyId, showAll, exclusive]);

  // Fecha picker de emoji ao clicar fora
  useEffect(() => {
    const close = () => setEmojiOpen(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, isPublic, role }),
      });
      const newBroadcast = await res.json();
      setBroadcasts((prev) => [newBroadcast, ...prev]);
      setTitle("");
      setMessage("");
      setIsPublic(false);
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReact = async (broadcastId: number, emoji: string) => {
    setEmojiOpen(null);
    const res = await fetch(`/api/broadcasts/${broadcastId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    const updatedReactions = await res.json();
    setBroadcasts((prev) =>
      prev.map((b) => b.id === broadcastId ? { ...b, reactions: updatedReactions } : b)
    );
  };

  const canPost = !showAll && !!role;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bc-in { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .bc-card { animation: bc-in 0.3s cubic-bezier(.22,1,.36,1) both; }
        @keyframes form-in { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .bc-form { animation: form-in 0.25s cubic-bezier(.22,1,.36,1) both; }
        .emoji-picker { animation: form-in 0.15s ease both; }
      `}} />

      <div className="flex flex-col gap-5">

        {/* COMPOSE BUTTON / FORM */}
        {canPost && (
          <div>
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 text-left group"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: accentColor + "20" }}
                >
                  <Pencil size={14} style={{ color: accentColor }} />
                </div>
                <span className="text-sm text-gray-400 group-hover:text-gray-500 transition">
                  Escreva uma mensagem para as outras sociedades...
                </span>
              </button>
            ) : (
              <div className="bc-form bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
                {/* Form header */}
                <div className="px-5 pt-5 pb-3 border-b border-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Nova mensagem</span>
                    <button onClick={() => setShowForm(false)} className="text-gray-300 hover:text-gray-500 transition">
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Título..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-base font-semibold text-gray-800 outline-none placeholder:text-gray-300"
                  />
                </div>

                <textarea
                  placeholder="Escreva sua mensagem aqui..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-5 py-4 text-sm text-gray-600 outline-none resize-none placeholder:text-gray-300 leading-relaxed"
                />

                {/* Form footer */}
                <div className="px-5 py-3 bg-gray-50/50 flex items-center justify-between gap-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-medium">Visível para:</span>
                    <button
                      onClick={() => setIsPublic(false)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                      style={!isPublic
                        ? { background: accentColor, color: "#fff" }
                        : { background: "#f3f4f6", color: "#9ca3af" }
                      }
                    >
                      <Lock size={10} /> Sociedades
                    </button>
                    <button
                      onClick={() => setIsPublic(true)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                      style={isPublic
                        ? { background: accentColor, color: "#fff" }
                        : { background: "#f3f4f6", color: "#9ca3af" }
                      }
                    >
                      <Globe size={10} /> Todos
                    </button>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !title.trim() || !message.trim()}
                    className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-xl text-white disabled:opacity-40 transition-all hover:opacity-90 active:scale-95"
                    style={{ background: accentColor }}
                  >
                    {submitting
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Send size={14} />
                    }
                    Publicar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FEED */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-4/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <MessageSquare size={24} className="text-gray-200" />
            </div>
            <p className="text-gray-600 font-semibold">Nenhuma mensagem ainda</p>
            <p className="text-gray-400 text-sm mt-1">
              {canPost ? "Seja o primeiro a publicar uma mensagem!" : "As mensagens aparecerão aqui."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {broadcasts.map((b, idx) => {
              const sc = societyColors[b.authorRole] ?? { color: "#6b7280", light: "#f9fafb" };
              const grouped = groupReactions(b.reactions);
              const isOwnSociety = b.authorRole === role;

              return (
                <div
                  key={b.id}
                  className="bc-card bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Topo colorido se for de outra sociedade */}
                  {!isOwnSociety && (
                    <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${sc.color}, ${sc.color}44)` }} />
                  )}

                  <div className="p-5">
                    {/* Header do card */}
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar name={b.authorName} color={sc.color} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800">{b.authorName}</span>
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ background: sc.light, color: sc.color }}
                          >
                            {b.society?.name}
                          </span>
                          <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            b.isPublic ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                          }`}>
                            {b.isPublic ? <Globe size={8} /> : <Lock size={8} />}
                            {b.isPublic ? "Pública" : "Sociedades"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(b.createdAt)}</p>
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="ml-12">
                      <h3 className="font-bold text-gray-900 text-base leading-snug mb-2">{b.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{b.message}</p>
                    </div>

                    {/* Reações */}
                    <div className="ml-12 mt-4 flex items-center gap-2 flex-wrap">
                      {Object.entries(grouped).map(([emoji, { count, users }]) => {
                        const reacted = b.reactions.some((r) => r.emoji === emoji && r.userId === user?.id);
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReact(b.id, emoji)}
                            title={users.join(", ")}
                            className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border transition-all active:scale-95"
                            style={reacted
                              ? { borderColor: accentColor + "44", background: accentColor + "15", color: accentColor }
                              : { borderColor: "#e5e7eb", background: "#f9fafb", color: "#6b7280" }
                            }
                          >
                            <span>{emoji}</span>
                            <span className="text-xs font-semibold">{count}</span>
                          </button>
                        );
                      })}

                      {/* Picker de emoji */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setEmojiOpen(emojiOpen === b.id ? null : b.id)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition"
                        >
                          <span>😊</span>
                          <span className="text-[10px]">+</span>
                        </button>

                        {emojiOpen === b.id && (
                          <div className="emoji-picker absolute bottom-full left-0 mb-2 bg-white border border-gray-100 shadow-xl rounded-2xl p-2 flex gap-1 z-20">
                            {EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleReact(b.id, emoji)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-lg active:scale-90"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}