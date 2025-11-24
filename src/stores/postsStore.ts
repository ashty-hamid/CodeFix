import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { postService } from '@/services/postService'
import { commentService } from '@/services/commentService'
import { useAuthStore } from './authStore'
import type { Post, Comment, Tag } from '@/types/api.types'

export const usePostsStore = defineStore('postsStore', () => {
  const posts = ref<Post[]>([])
  const currentPost = ref<Post | null>(null)
  const comments = ref<Comment[]>([])
  const tags = ref<Tag[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Fetch all posts
  async function fetchPosts(query?: { page?: number; limit?: number; search?: string; tagId?: number; authorId?: number }) {
    isLoading.value = true
    error.value = null
    try {
      const response = await postService.getPosts(query)
      console.log('Posts response:', response)
      
      // Handle response - it should have a data property with the posts array
      if (response && response.data && Array.isArray(response.data)) {
        posts.value = response.data
        console.log('Posts set in store:', posts.value.length, posts.value)
      } else if (Array.isArray(response)) {
        // Fallback: if response is directly an array
        posts.value = response
        console.log('Posts set directly from array:', posts.value.length)
      } else {
        console.warn('Unexpected response format:', response)
        posts.value = []
      }
      
      return response
    } catch (e: any) {
      console.error('Error fetching posts:', e)
      console.error('Error details:', {
        message: e.message,
        status: e.response?.status,
        data: e.response?.data
      })
      error.value = e.response?.data?.message || e.message || 'Failed to fetch posts'
      posts.value = [] // Clear posts on error
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Fetch single post with comments
  async function fetchPostById(id: number) {
    isLoading.value = true
    error.value = null
    try {
      const post = await postService.getPostById(id)
      currentPost.value = post
      
      // Fetch comments for this post
      const postComments = await commentService.getCommentsByPost(id)
      comments.value = postComments
      
      return post
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || 'Failed to fetch post'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Create new post
  async function addPost({ title, body, tags: tagInput }: { title: string; body: string; tags?: (number | string)[] }) {
    isLoading.value = true
    error.value = null
    try {
      const newPost = await postService.createPost({ title, body, tags: tagInput })
      posts.value.unshift(newPost) // Add to beginning of list
      return newPost
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || 'Failed to create post'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Add comment/answer
  async function addAnswer({ postId, content }: { postId: number; content: string }) {
    isLoading.value = true
    error.value = null
    try {
      const newComment = await commentService.createComment({ postId, content })
      comments.value.push(newComment)
      return newComment
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || 'Failed to add comment'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Vote on comment
  async function voteAnswer({ commentId, type }: { commentId: number; type: 'upvote' | 'downvote' }) {
    try {
      const updatedComment = await commentService.voteComment(commentId, { type })
      // Update comment in local state
      const index = comments.value.findIndex(c => c.id === commentId)
      if (index !== -1) {
        comments.value[index] = updatedComment
      }
      return updatedComment
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || 'Failed to vote'
      throw e
    }
  }

  // Fetch tags
  async function fetchTags() {
    try {
      const { tagService } = await import('@/services/tagService')
      const tagsData = await tagService.getTags()
      tags.value = tagsData
    } catch (e: any) {
      console.error('Failed to fetch tags:', e)
    }
  }

  // Computed getters
  const postsWithMeta = computed(() => posts.value)

  function postById(id: number) {
    if (currentPost.value?.id === id) {
      return {
        ...currentPost.value,
        answers: comments.value,
      }
    }
    const post = posts.value.find((p) => p.id === id)
    if (!post) return null
    return {
      ...post,
      answers: comments.value.filter((c) => c.postId === id),
    }
  }

  const allTags = computed(() => {
    // Extract unique tags from posts, filtering out null/undefined tags
    const tagMap = new Map<number, Tag>()
    posts.value.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          // Filter out null/undefined tags
          if (tag && tag.id) {
            if (!tagMap.has(tag.id)) {
              tagMap.set(tag.id, tag)
            }
          }
        })
      }
    })
    return Array.from(tagMap.values())
  })

  return {
    posts,
    currentPost,
    comments,
    tags,
    isLoading,
    error,
    fetchPosts,
    fetchPostById,
    addPost,
    addAnswer,
    voteAnswer,
    fetchTags,
    postsWithMeta,
    postById,
    allTags,
  }
})
