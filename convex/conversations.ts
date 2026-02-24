import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get or create a conversation between two users
export const getOrCreateConversation = mutation({
  args: {
    currentUserId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Look for existing conversation with both users
    const conversations = await ctx.db.query("conversations").collect();
    
    const existing = conversations.find((c) => {
      return (
        c.participants.includes(args.currentUserId) &&
        c.participants.includes(args.otherUserId)
      );
    });

    if (existing) return existing._id;

    // No conversation exists, create one
    return await ctx.db.insert("conversations", {
      participants: [args.currentUserId, args.otherUserId],
      lastMessageTime: Date.now(),
    });
  },
});

// Get all conversations for the current user
export const getUserConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const conversations = await ctx.db.query("conversations").collect();

    // Only conversations this user is part of
    const userConversations = conversations.filter((c) =>
      c.participants.includes(args.userId)
    );

    // For each conversation, get the other user's info and last message
    const result = await Promise.all(
      userConversations.map(async (conv) => {
        const otherUserId = conv.participants.find((p) => p !== args.userId)!;
        const otherUser = await ctx.db.get(otherUserId);

        // Get the last message in this conversation
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", conv._id)
          )
          .collect();

        const lastMessage = messages[messages.length - 1];

        // Get unread count for current user
        const unread = await ctx.db
          .query("unreadCounts")
          .withIndex("by_user_and_conversation", (q) =>
            q.eq("userId", args.userId).eq("conversationId", conv._id)
          )
          .first();

        return {
          ...conv,
          otherUser,
          lastMessage,
          unreadCount: unread?.count ?? 0,
        };
      })
    );

    // Sort by most recent message
    return result.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  },
});
// Get a single conversation with other user's info
export const getConversationWithUser = query({
  args: {
    conversationId: v.id("conversations"),
    currentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    const otherUserId = conversation.participants.find(
      (p) => p !== args.currentUserId
    );
    if (!otherUserId) return null;

    const otherUser = await ctx.db.get(otherUserId);
    return { ...conversation, otherUser };
  },
});