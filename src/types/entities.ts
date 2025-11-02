import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
  role: z.string(),
  profileImageUrl: z.string().url().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PostSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string(),
  views: z.number(),
  excerpt: z.string().optional(),
  createdAt: z.string(),
  authorId: z.number(),
});

export const CommentSchema = z.object({
  id: z.number(),
  content: z.string(),
  score: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  postId: z.number(),
  authorId: z.number(),
});

export const TagSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  createdAt: z.string(),
});

export const PostTagSchema = z.object({
  postId: z.number(),
  tagId: z.number(),
});

export const VoteSchema = z.object({
  id: z.number(),
  type: z.enum(["upvote", "downvote"]),
  createdAt: z.string(),
  userId: z.number(),
  commentId: z.number(),
});

// Optional TypeScript types from schemas
export type User = z.infer<typeof UserSchema>;
export type Post = z.infer<typeof PostSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type Tag = z.infer<typeof TagSchema>;
export type PostTag = z.infer<typeof PostTagSchema>;
export type Vote = z.infer<typeof VoteSchema>;
