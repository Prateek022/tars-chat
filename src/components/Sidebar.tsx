"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useUser, UserButton } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

type Props = {
  currentUser: {
    _id: Id<"users">;
    name: string;
    imageUrl: string;
    clerkId: string;
  };
  selectedConversationId: Id<"conversations"> | null;
  onSelectConversation: (id: Id<"conversations">) => void;
};

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (isThisYear) {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } else {
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}

export default function Sidebar({
  currentUser,
  selectedConversationId,
  onSelectConversation,
}: Props) {
  const [search, setSearch] = useState("");
  const [showUsers, setShowUsers] = useState(false);

  const conversations = useQuery(api.conversations.getUserConversations, {
    userId: currentUser._id,
  });

  const allUsers = useQuery(api.users.getAllUsers, {
    clerkId: currentUser.clerkId,
  });

  const getOrCreateConversation = useMutation(
    api.conversations.getOrCreateConversation
  );

  const markAsRead = useMutation(api.messages.markAsRead);

  const filteredUsers = allUsers?.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectUser = async (userId: Id<"users">) => {
    const convId = await getOrCreateConversation({
      currentUserId: currentUser._id,
      otherUserId: userId,
    });
    onSelectConversation(convId);
    setSearch("");
    setShowUsers(false);
  };

  const handleSelectConversation = async (convId: Id<"conversations">) => {
    await markAsRead({ conversationId: convId, userId: currentUser._id });
    onSelectConversation(convId);
  };

  return (
    <div className="flex flex-col w-full bg-slate-900 border-r border-slate-800">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-white font-bold text-xl">Tars Chat</h1>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3">
          <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowUsers(true);
            }}
            onFocus={() => setShowUsers(true)}
            className="bg-transparent text-white placeholder:text-slate-400 outline-none w-full text-sm"
          />
        </div>

        {/* Search results dropdown */}
        {showUsers && search && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-h-52 overflow-y-auto">
            {filteredUsers?.length === 0 ? (
              <p className="text-slate-400 text-sm p-4 text-center">
                No users found
              </p>
            ) : (
              filteredUsers?.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleSelectUser(u._id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={u.imageUrl} />
                      <AvatarFallback className="bg-slate-600 text-white">
                        {u.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-800 ${
                        u.isOnline ? "bg-green-500" : "bg-slate-500"
                      }`}
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">{u.name}</p>
                    <p className="text-slate-400 text-xs">
                      {u.isOnline ? "🟢 Online" : "⚫ Offline"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {conversations === undefined ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-slate-700 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-sm text-center leading-relaxed">
              No conversations yet.{" "}
              <span className="text-blue-400">Search for a user</span> to start
              chatting!
            </p>
          </div>
        ) : (
          <div>
            {conversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => handleSelectConversation(conv._id)}
                className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-800 transition-colors border-b border-slate-800/50 ${
                  selectedConversationId === conv._id
                    ? "bg-slate-800"
                    : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.otherUser?.imageUrl} />
                    <AvatarFallback className="bg-slate-600 text-white">
                      {conv.otherUser?.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 ${
                      conv.otherUser?.isOnline ? "bg-green-500" : "bg-slate-500"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white font-medium text-sm truncate">
                      {conv.otherUser?.name}
                    </p>
                    {conv.lastMessage && (
                      <span className="text-slate-500 text-xs flex-shrink-0 ml-2">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-slate-400 text-xs truncate">
                      {conv.lastMessage
                        ? conv.lastMessage.isDeleted
                          ? "This message was deleted"
                          : conv.lastMessage.content
                        : "No messages yet"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge className="ml-2 bg-blue-600 hover:bg-blue-600 text-white text-xs flex-shrink-0 h-5 min-w-5 flex items-center justify-center rounded-full">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}