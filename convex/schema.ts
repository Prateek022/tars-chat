import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Stores every user who signs up
  users: defineTable({
    clerkId: v.string(),      // Clerk's unique ID for this user
    name: v.string(),          // Display name
    email: v.string(),         // Email address
    imageUrl: v.string(),      // Profile picture URL
    isOnline: v.boolean(),     // Are they currently online?
    lastSeen: v.number(),      // Timestamp of last activity
  }).index("by_clerkId", ["clerkId"]),  // So we can quickly find a user by their Clerk ID

  // A conversation between two users
  conversations: defineTable({
    participants: v.array(v.id("users")),  // Array of 2 user IDs
    lastMessageTime: v.number(),            // For sorting conversations by recent
  }),

  // Every message sent
  messages: defineTable({
    conversationId: v.id("conversations"), // Which conversation this belongs to
    senderId: v.id("users"),               // Who sent it
    content: v.string(),                   // The message text
    isDeleted: v.boolean(),                // Soft delete (feature 11)
    createdAt: v.number(),                 // Timestamp
  }).index("by_conversation", ["conversationId"]),  // Quickly get all messages in a conversation

  // Tracks who is typing in which conversation
  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastTypedAt: v.number(),  // We use this to auto-clear after 2 seconds
  }).index("by_conversation", ["conversationId"]),

  // Tracks unread message counts
  unreadCounts: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    count: v.number(),
  }).index("by_user_and_conversation", ["userId", "conversationId"]),
});