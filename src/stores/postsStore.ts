// import { defineStore } from "pinia";
// // enable JSON imports (tsconfig "resolveJsonModule": true)
// import data from "@/data/sampleData.json";
// import type { Post, User, Comment, Tag, Vote, PostTag } from "@/types/entities";

// type EnrichedComment = Comment & {
//   author: User | undefined;
//   upvotes: number;
//   downvotes: number;
// };

// type EnrichedPost = Post & {
//   author: User | undefined;
//   tags: Tag[];
//   comments: EnrichedComment[];
//   answersCount: number;
// };

// export const usePostsStore = defineStore("posts", {
//   state: () => ({
//     users: data.users as User[],
//     posts: data.posts as Post[],
//     comments: data.comments as Comment[],
//     tags: data.tags as Tag[],
//     postTags: data.post_tags as PostTag[],
//     votes: data.votes as Vote[],
//     _nextIds: {
//       post: Math.max(...data.posts.map(p => p.id)) + 1,
//       comment: Math.max(...data.comments.map(c => c.id)) + 1,
//       vote: Math.max(...data.votes.map(v => v.id)) + 1,
//     }
//   }),
//   getters: {
//     allTags(state): Tag[] { return state.tags; },

//     postsWithMeta(state): EnrichedPost[] {
//       return state.posts
//         .slice()
//         .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
//         .map(p => {
//           const author = state.users.find(u => u.id === p.authorId);
//           const tagIds = state.postTags.filter(pt => pt.postId === p.id).map(pt => pt.tagId);
//           const tags = state.tags.filter(t => tagIds.includes(t.id));
//           const comments = state.comments
//             .filter(c => c.postId === p.id)
//             .map(c => {
//               const up = state.votes.filter(v => v.commentId === c.id && v.type === "upvote").length;
//               const down = state.votes.filter(v => v.commentId === c.id && v.type === "downvote").length;
//               return { ...c, author: state.users.find(u => u.id === c.authorId), upvotes: up, downvotes: down };
//             });
//           return {
//             ...p,
//             author,
//             tags,
//             comments,
//             answersCount: comments.length,
//           };
//         });
//     },

//     postById: (state) => {
//       return (id: number): EnrichedPost | undefined =>
//         (state as any).postsWithMeta.find((p: EnrichedPost) => p.id === id);
//     },
//   },

//   actions: {
//     addPost(payload: { title: string; body: string; excerpt?: string; tagNames: string[]; authorId: number }) {
//       const id = this._nextIds.post++;
//       const createdAt = new Date().toISOString();
//       const post: Post = { id, title: payload.title, body: payload.body, views: 0, excerpt: payload.excerpt, createdAt, authorId: payload.authorId };
//       this.posts.push(post);

//       // ensure tags exist, create if new
//       const tagIds: number[] = [];
//       payload.tagNames.forEach(name => {
//         const existing = this.tags.find(t => t.name.toLowerCase() === name.toLowerCase());
//         if (existing) tagIds.push(existing.id);
//         else {
//           const newTagId = (this.tags.at(-1)?.id ?? 0) + 1;
//           this.tags.push({ id: newTagId, name, description: "", createdAt });
//           tagIds.push(newTagId);
//         }
//       });
//       tagIds.forEach(tagId => this.postTags.push({ postId: id, tagId }));

//       return id;
//     },

//     addAnswer(payload: { postId: number; content: string; authorId: number }) {
//       const id = this._nextIds.comment++;
//       const now = new Date().toISOString();
//       const comment: Comment = { id, content: payload.content, score: 0, createdAt: now, updatedAt: now, postId: payload.postId, authorId: payload.authorId };
//       this.comments.push(comment);
//       return id;
//     },

//     voteComment(payload: { commentId: number; userId: number; type: "upvote" | "downvote" }) {
//       // simple: allow multiple votes in sample; to toggle, first remove existing by same user
//       const existing = this.votes.find(v => v.commentId === payload.commentId && v.userId === payload.userId);
//       if (existing) {
//         // toggle if same type, otherwise switch
//         if (existing.type === payload.type) {
//           this.votes = this.votes.filter(v => v !== existing);
//           return;
//         } else {
//           existing.type = payload.type;
//           existing.createdAt = new Date().toISOString();
//           return;
//         }
//       }
//       this.votes.push({ id: this._nextIds.vote++, type: payload.type, createdAt: new Date().toISOString(), userId: payload.userId, commentId: payload.commentId });
//     }
//   }
// });

import { defineStore } from "pinia";

export const usePostsStore = defineStore("postsStore", {
  state: () => ({
    posts: [],       // ALL posts (reactive)
    tags: [],        // ALL unique tags
    comments: [],    // optional for later
    votes: []        // optional for later
  }),

  getters: {
    allTags(state) {
      return state.tags;
    },

    postsWithMeta(state) {
      return state.posts.map(p => ({
        ...p,
        tags: p.tags.map(id => state.tags.find(t => t.id === id)),
        author: { username: "User" },    // TEMP until auth finished
        answersCount: 0                  // TEMP until comments added
      }));
    }
  },

  actions: {
    addPost({ title, body, tagNames, authorId }) {
      const id = this.posts.length + 1;

      // Convert tag names to tag objects (create if missing)
      const tagIds = tagNames.map(name => {
        let tag = this.tags.find(t => t.name === name);
        if (!tag) {
          tag = { id: this.tags.length + 1, name };
          this.tags.push(tag);
        }
        return tag.id;
      });

      const newPost = {
        id,
        title,
        body,
        excerpt: body.slice(0, 120) + "…",
        tags: tagIds,
        authorId,
        createdAt: new Date().toISOString()
      };

      this.posts.unshift(newPost); // add to top

      return id;
    }
  }
});

