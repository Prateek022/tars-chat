import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all messages in a conversation
export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    // For each message, get the sender's info
    const result = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return { ...msg, sender };
      })
    );

    return result;
  },
});

// Send a new message
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Insert the message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content,
      isDeleted: false,
      createdAt: Date.now(),
    });

    // Update conversation's last message time
    await ctx.db.patch(args.conversationId, {
      lastMessageTime: Date.now(),
    });

    // Update unread counts for the other participants
    const conversation = await ctx.db.get(args.conversationId);
    if (conversation) {
      const otherParticipants = conversation.participants.filter(
        (p) => p !== args.senderId
      );

      for (const participantId of otherParticipants) {
        const existing = await ctx.db
          .query("unreadCounts")
          .withIndex("by_user_and_conversation", (q) =>
            q.eq("userId", participantId).eq("conversationId", args.conversationId)
          )
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, { count: existing.count + 1 });
        } else {
          await ctx.db.insert("unreadCounts", {
            conversationId: args.conversationId,
            userId: participantId,
            count: 1,
          });
        }
      }
    }

    return messageId;
  },
});

// Clear unread count when user opens a conversation
export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("unreadCounts")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { count: 0 });
    }
  },
});

// Soft delete a message
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, { isDeleted: true });
  },
});