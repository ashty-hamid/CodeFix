import { defineStore } from 'pinia'
import sample from '@/data/sampleData.json'

export const usePostsStore = defineStore('postsStore', {
  state: () => ({
    users: sample.users,
    posts: sample.posts,
    comments: sample.comments, // answers = comments
    tags: sample.tags,
    postTags: sample.post_tags,
    votes: sample.votes, // votes on comments

    nextIds: {
      post: Math.max(...sample.posts.map((p) => p.id)) + 1,
      comment: Math.max(...sample.comments.map((c) => c.id)) + 1,
      vote: Math.max(...sample.votes.map((v) => v.id)) + 1,
    },
  }),

  getters: {
    // ----------------------------------------------------
    // All tags
    // ----------------------------------------------------
    allTags(state) {
      return state.tags
    },

    // ----------------------------------------------------
    // Posts enriched with author, tags, answers count, etc.
    // ----------------------------------------------------
    postsWithMeta(state) {
      return state.posts.map((post) => {
        const author = state.users.find((u) => u.id === post.authorId)

        const tagIds = state.postTags.filter((pt) => pt.postId === post.id).map((pt) => pt.tagId)

        const postTags = tagIds.map((id) => state.tags.find((t) => t.id === id)).filter(Boolean)

        const answers = state.comments.filter((c) => c.postId === post.id)

        return {
          ...post,
          author,
          tags: postTags,
          answersCount: answers.length,
        }
      })
    },

    // ----------------------------------------------------
    // Single post with enriched answers (author + votes)
    // ----------------------------------------------------
    postById: (state) => (id: number) => {
      const post = state.posts.find((p) => p.id === id)
      if (!post) return null

      const author = state.users.find((u) => u.id === post.authorId)

      const tagIds = state.postTags.filter((pt) => pt.postId === id).map((pt) => pt.tagId)

      const postTags = tagIds.map((id) => state.tags.find((t) => t.id === id)).filter(Boolean)

      const answers = state.comments
        .filter((c) => c.postId === id)
        .map((comment) => {
          const commentVotes = state.votes.filter((v) => v.commentId === comment.id)
          const score =
            commentVotes.filter((v) => v.type === 'upvote').length -
            commentVotes.filter((v) => v.type === 'downvote').length

          const author = state.users.find((u) => u.id === comment.authorId)

          return {
            ...comment,
            author,
            score,
          }
        })

      return {
        ...post,
        author,
        tags: postTags,
        answers,
      }
    },
  },

  actions: {
    // ----------------------------------------------------
    // ADD NEW POST
    // ----------------------------------------------------
    addPost({ title, body, tagNames, authorId }) {
      const id = this.nextIds.post++

      // create new tags if necessary
      const tagIds = tagNames.map((name) => {
        let tag = this.tags.find((t) => t.name.toLowerCase() === name.toLowerCase())
        if (!tag) {
          tag = {
            id: this.tags.length + 1,
            name,
            description: '',
            createdAt: new Date().toISOString(),
          }
          this.tags.push(tag)
        }
        return tag.id
      })

      // add new post
      this.posts.push({
        id,
        title,
        body,
        views: 0,
        excerpt: body.slice(0, 120),
        createdAt: new Date().toISOString(),
        authorId,
      })

      // connect post <-> tags
      tagIds.forEach((tagId) => {
        this.postTags.push({ postId: id, tagId })
      })

      return id
    },

    // ----------------------------------------------------
    // ADD NEW ANSWER (COMMENT)
    // ----------------------------------------------------
    addAnswer({ postId, content, authorId }) {
      const id = this.nextIds.comment++

      this.comments.push({
        id,
        postId,
        content,
        score: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorId,
      })
    },

    // ----------------------------------------------------
    // VOTE ANSWER
    // ----------------------------------------------------
    voteAnswer({ commentId, userId, type }) {
      const existing = this.votes.find((v) => v.commentId === commentId && v.userId === userId)

      if (existing) {
        existing.type = type // overwrite previous vote
      } else {
        this.votes.push({
          id: this.nextIds.vote++,
          type,
          createdAt: new Date().toISOString(),
          userId,
          commentId,
        })
      }
    },
  },
})
