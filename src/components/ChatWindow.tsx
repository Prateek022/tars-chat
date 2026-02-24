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
    return `${date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } else {
    return `${date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
}

export default function ChatWindow({
  conversationId,
  currentUser,
  onBack,
}: Props) {
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

  const otherUser =
    conversationData?.otherUser ??
    messages?.find((m) => m.senderId !== currentUser._id)?.sender;

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
        <button
          onClick={onBack}
          className="md:hidden text-slate-400 hover:text-white p-1"
        >
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
              <span
                className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${
                  otherUser.isOnline ? "bg-green-500" : "bg-slate-500"
                }`}
              />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">{otherUser.name}</p>
              <p className="text-sm text-slate-400">
                {otherUser.isOnline ? "🟢 Online" : "⚫ Offline"}
              </p>
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
        className="relative flex-1 overflow-y-auto px-6 py-6 space-y-6"
      >
        {messages === undefined ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : ""} animate-pulse`}
              >
                <div className="h-12 bg-slate-800 rounded-2xl w-56" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="text-6xl mb-4">👋</div>
            <p className="text-base">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser._id;
            return (
              <div
                key={msg._id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-3 w-full max-w-[70%] ${
                    isMe ? "flex-row-reverse ml-auto" : "mr-auto"
                  }`}
                >
                  {!isMe && (
                    <Avatar className="h-9 w-9 flex-shrink-0 mt-1">
                      <AvatarImage src={msg.sender?.imageUrl} />
                      <AvatarFallback className="bg-slate-600 text-white">
                        {msg.sender?.name[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="min-w-0 flex-1">
                    <div
                      className={`px-5 py-3 rounded-2xl text-sm leading-relaxed break-words overflow-hidden ${
                        isMe
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-slate-800 text-white rounded-bl-sm"
                      }`}
                    >
                      {msg.isDeleted ? (
                        <p className="italic text-slate-400">
                          This message was deleted
                        </p>
                      ) : (
                        <p className="break-all">{msg.content}</p>
                      )}
                    </div>
                    <div
                      className={`flex items-center gap-3 mt-1.5 ${
                        isMe ? "justify-end" : ""
                      }`}
                    >
                      <p className="text-slate-500 text-xs">
                        {formatMessageTime(msg.createdAt)}
                      </p>
                      {isMe && !msg.isDeleted && (
                        <button
                          onClick={() =>
                            deleteMessage({ messageId: msg._id })
                          }
                          className="text-slate-600 hover:text-red-400 text-xs transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers && typingUsers.length > 0 && (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={typingUsers[0]?.imageUrl} />
              <AvatarFallback className="bg-slate-600 text-white">
                {typingUsers[0]?.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="bg-slate-800 px-5 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1.5 items-center">
                <span className="h-2.5 w-2.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="h-2.5 w-2.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="h-2.5 w-2.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        {/* New messages button */}
        {showNewMessages && (
          <button
            onClick={scrollToBottom}
            className="sticky bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <ChevronDown className="h-4 w-4" />
            New messages
          </button>
        )}
      </div>

      {/* Message input */}
      <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex-shrink-0">
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 rounded-2xl px-5 py-3.5 outline-none focus:border-blue-500 transition-colors text-sm"
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