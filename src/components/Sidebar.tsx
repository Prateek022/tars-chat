"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useUser, UserButton } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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

// Format timestamp for last message preview
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

  // Filter users by search
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
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white font-bold text-xl">Tars Chat</h1>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowUsers(true);
            }}
            onFocus={() => setShowUsers(true)}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
          />
        </div>

        {/* User search results dropdown */}
        {showUsers && search && (
          <div className="mt-2 bg-slate-800 rounded-lg border border-slate-700 max-h-48 overflow-y-auto">
            {filteredUsers?.length === 0 ? (
              <p className="text-slate-400 text-sm p-3">No users found</p>
            ) : (
              filteredUsers?.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleSelectUser(u._id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-700 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.imageUrl} />
                      <AvatarFallback>{u.name[0]}</AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    <span
                      className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-800 ${
                        u.isOnline ? "bg-green-500" : "bg-slate-500"
                      }`}
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">{u.name}</p>
                    <p className="text-slate-400 text-xs">
                      {u.isOnline ? "Online" : "Offline"}
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
          // Loading state
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm text-center">
              No conversations yet. Search for a user to start chatting!
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv._id}
              onClick={() => handleSelectConversation(conv._id)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-slate-800 transition-colors border-b border-slate-800 ${
                selectedConversationId === conv._id ? "bg-slate-800" : ""
              }`}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conv.otherUser?.imageUrl} />
                  <AvatarFallback>{conv.otherUser?.name[0]}</AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <span
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 ${
                    conv.otherUser?.isOnline ? "bg-green-500" : "bg-slate-500"
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <p className="text-white font-medium truncate">
                    {conv.otherUser?.name}
                  </p>
                  {conv.lastMessage && (
                    <span className="text-slate-400 text-xs flex-shrink-0 ml-2">
                      {formatTime(conv.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-slate-400 text-sm truncate">
                    {conv.lastMessage
                      ? conv.lastMessage.isDeleted
                        ? "This message was deleted"
                        : conv.lastMessage.content
                      : "No messages yet"}
                  </p>
                  {conv.unreadCount > 0 && (
                    <Badge className="ml-2 bg-blue-600 text-white text-xs flex-shrink-0">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}