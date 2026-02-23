"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

export default function Home() {
  const { user } = useUser();
  const [selectedConversationId, setSelectedConversationId] =
    useState<Id<"conversations"> | null>(null);
  const [showChat, setShowChat] = useState(false);

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar - hidden on mobile when chat is open */}
      <div
        className={`${
          showChat ? "hidden" : "flex"
        } md:flex w-full md:w-80 lg:w-96 flex-shrink-0`}
      >
        <Sidebar
          currentUser={currentUser}
          selectedConversationId={selectedConversationId}
          onSelectConversation={(id) => {
            setSelectedConversationId(id);
            setShowChat(true);
          }}
        />
      </div>

      {/* Chat area - hidden on mobile when sidebar is showing */}
      <div className={`${showChat ? "flex" : "hidden"} md:flex flex-1`}>
        {selectedConversationId ? (
          <ChatWindow
            conversationId={selectedConversationId}
            currentUser={currentUser}
            onBack={() => setShowChat(false)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-xl font-medium">Welcome to Tars Chat</p>
              <p className="text-sm mt-2">
                Select a conversation or search for a user to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}