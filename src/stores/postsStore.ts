import { defineStore } from 'pinia'
import sample from '@/data/sampleData.json'
import { useAuthStore } from './authStore'

export const usePostsStore = defineStore('postsStore', {
  state: () => ({
    users: sample.users,
    posts: sample.posts,
    comments: sample.comments,
    tags: sample.tags,
    postTags: sample.post_tags,
    votes: sample.votes,

    nextIds: {
      post: Math.max(...sample.posts.map((p) => p.id)) + 1,
      comment: Math.max(...sample.comments.map((c) => c.id)) + 1,
      vote: Math.max(...sample.votes.map((v) => v.id)) + 1,
    },
  }),

  getters: {
    allTags(state) {
      return state.tags
    },

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

          return { ...comment, author, score }
        })

      return { ...post, author, tags: postTags, answers }
    },
  },

  actions: {
    /** ADD POST */
    addPost({ title, body, tagNames }) {
      const auth = useAuthStore()
      if (!auth.user) throw new Error('You must be logged in to post')

      const authorId = auth.user.id
      const id = this.nextIds.post++

      // create tags if needed
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

      this.posts.push({
        id,
        title,
        body,
        views: 0,
        excerpt: body.slice(0, 120),
        createdAt: new Date().toISOString(),
        authorId,
      })

      tagIds.forEach((tagId) => {
        this.postTags.push({ postId: id, tagId })
      })

      // update user stats
      auth.user.postsCount++

      return id
    },

    /** ADD ANSWER */
    addAnswer({ postId, content }) {
      const auth = useAuthStore()
      if (!auth.user) throw new Error('Login required')

      const authorId = auth.user.id
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

      // update user stats
      auth.user.answersCount++
    },

    /** VOTE ANSWER */
    voteAnswer({ commentId, userId, type }) {
      const existing = this.votes.find((v) => v.commentId === commentId && v.userId === userId)

      if (existing) {
        existing.type = type
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
