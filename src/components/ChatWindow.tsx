"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, ChevronDown } from "lucide-react";

type Props = {
  conversationId: Id<"conversations">;
  currentUser: {
    _id: Id<"users">;
    name: string;
    imageUrl: string;
  };
  onBack: () => void;
};

function formatMessageTime(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (isThisYear) {
    return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } else {
    return `${date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
}

export default function ChatWindow({ conversationId, currentUser, onBack }: Props) {
  const [message, setMessage] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const messages = useQuery(api.messages.getMessages, { conversationId });
  const conversationData = useQuery(api.conversations.getConversationWithUser, {
    conversationId,
    currentUserId: currentUser._id,
  });
  const typingUsers = useQuery(api.typing.getTypingUsers, {
    conversationId,
    currentUserId: currentUser._id,
  });

  const sendMessage = useMutation(api.messages.sendMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const setTyping = useMutation(api.typing.setTyping);
  const clearTyping = useMutation(api.typing.clearTyping);
  const markAsRead = useMutation(api.messages.markAsRead);

  const otherUser = conversationData?.otherUser ?? messages?.find((m) => m.senderId !== currentUser._id)?.sender;

  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowNewMessages(false);
    } else {
      setShowNewMessages(true);
    }
  }, [messages, isAtBottom]);

  useEffect(() => {
    markAsRead({ conversationId, userId: currentUser._id });
  }, [conversationId, currentUser._id, markAsRead]);

  const handleScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setIsAtBottom(atBottom);
    if (atBottom) setShowNewMessages(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
    setShowNewMessages(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    setTyping({ conversationId, userId: currentUser._id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      clearTyping({ conversationId, userId: currentUser._id });
    }, 2000);
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    await sendMessage({
      conversationId,
      senderId: currentUser._id,
      content: message.trim(),
    });
    await clearTyping({ conversationId, userId: currentUser._id });
    setMessage("");
    setIsAtBottom(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-slate-950">

      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-800 bg-slate-900 flex-shrink-0">
        <button onClick={onBack} className="md:hidden text-slate-400 hover:text-white p-1">
          <ArrowLeft className="h-6 w-6" />
        </button>
        {otherUser ? (
          <>
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherUser.imageUrl} />
                <AvatarFallback className="bg-slate-600 text-white text-lg">
                  {otherUser.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${otherUser.isOnline ? "bg-green-500" : "bg-slate-500"}`} />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">{otherUser.name}</p>
              <p className="text-sm text-slate-400">{otherUser.isOnline ? "🟢 Online" : "⚫ Offline"}</p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-700 animate-pulse" />
            <div className="h-5 w-32 bg-slate-700 rounded animate-pulse" />
          </div>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto px-4 py-4"
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        {messages === undefined ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-end" : "flex-start" }}>
                <div style={{ height: "48px", background: "#1e293b", borderRadius: "16px", width: "200px" }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, color: "#94a3b8" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>👋</div>
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser._id;
            return (
              <div
                key={msg._id}
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "8px",
                  justifyContent: isMe ? "flex-end" : "flex-start",
                }}
              >
                {/* Avatar for received messages */}
                {!isMe && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={msg.sender?.imageUrl} />
                    <AvatarFallback className="bg-slate-600 text-white text-xs">
                      {msg.sender?.name[0]}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Bubble + timestamp */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", maxWidth: "60%" }}>
                  <div
                    style={{
                      padding: "10px 16px",
                      borderRadius: "18px",
                      borderBottomRightRadius: isMe ? "4px" : "18px",
                      borderBottomLeftRadius: isMe ? "18px" : "4px",
                      background: isMe ? "#2563eb" : "#334155",
                      color: "white",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.isDeleted ? (
                      <span style={{ fontStyle: "italic", color: "#94a3b8", fontSize: "13px" }}>
                        This message was deleted
                      </span>
                    ) : (
                      msg.content
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexDirection: isMe ? "row-reverse" : "row" }}>
                    <span style={{ color: "#64748b", fontSize: "11px" }}>
                      {formatMessageTime(msg.createdAt)}
                    </span>
                    {isMe && !msg.isDeleted && (
                      <button
                        onClick={() => deleteMessage({ messageId: msg._id })}
                        style={{ color: "#475569", fontSize: "11px", background: "none", border: "none", cursor: "pointer" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers && typingUsers.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={typingUsers[0]?.imageUrl} />
              <AvatarFallback className="bg-slate-600 text-white text-xs">
                {typingUsers[0]?.name[0]}
              </AvatarFallback>
            </Avatar>
            <div style={{ background: "#334155", padding: "10px 16px", borderRadius: "18px", borderBottomLeftRadius: "4px" }}>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        {/* New messages button */}
        {showNewMessages && (
          <button
            onClick={scrollToBottom}
            style={{
              position: "sticky",
              bottom: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#2563eb",
              color: "white",
              padding: "8px 16px",
              borderRadius: "999px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              border: "none",
              cursor: "pointer",
              margin: "0 auto",
            }}
          >
            <ChevronDown size={16} />
            New messages
          </button>
        )}
      </div>

      {/* Message input */}
      <div className="px-4 py-4 border-t border-slate-800 bg-slate-900 flex-shrink-0">
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 transition-colors text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 w-12 p-0 flex items-center justify-center flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}