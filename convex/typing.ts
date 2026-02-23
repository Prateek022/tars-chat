import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Called every time a user types a character
export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      // Update the timestamp so we know they're still typing
      await ctx.db.patch(existing._id, { lastTypedAt: Date.now() });
    } else {
      // First time typing in this conversation
      await ctx.db.insert("typingIndicators", {
        conversationId: args.conversationId,
        userId: args.userId,
        lastTypedAt: Date.now(),
      });
    }
  },
});

// Get who is currently typing in a conversation
export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
    currentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const twoSecondsAgo = Date.now() - 2000;

    // Only return users who typed in the last 2 seconds and are not the current user
    const activeTypers = indicators.filter(
      (i) =>
        i.lastTypedAt > twoSecondsAgo && i.userId !== args.currentUserId
    );

    // Get their names
    const result = await Promise.all(
      activeTypers.map(async (i) => {
        const user = await ctx.db.get(i.userId);
        return user;
      })
    );

    return result.filter(Boolean);
  },
});

// Stop typing when message is sent
export const clearTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});