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
      // Mark best answer if post has one
      comments.value = postComments.map(comment => ({
        ...comment,
        isBestAnswer: post.bestAnswerId === comment.id,
      }))
      
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

  // Update post
  async function updatePost(id: number, postData: { title?: string; body?: string; tags?: (number | string)[] }) {
    isLoading.value = true
    error.value = null
    try {
      const updatedPost = await postService.updatePost(id, postData)
      // Update post in local state
      const index = posts.value.findIndex(p => p.id === id)
      if (index !== -1) {
        posts.value[index] = updatedPost
      }
      if (currentPost.value?.id === id) {
        currentPost.value = updatedPost
      }
      return updatedPost
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || 'Failed to update post'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Delete post
  async function deletePost(id: number) {
    isLoading.value = true
    error.value = null
    try {
      await postService.deletePost(id)
      // Remove post from local state
      posts.value = posts.value.filter(p => p.id !== id)
      if (currentPost.value?.id === id) {
        currentPost.value = null
      }
      // Remove comments for this post
      comments.value = comments.value.filter(c => c.postId !== id)
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || 'Failed to delete post'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Update answer/comment
  async function updateAnswer({ commentId, content }: { commentId: number; content: string }) {
    isLoading.value = true
    error.value = null
    try {
      const updatedComment = await commentService.updateComment(commentId, { content })
      // Update comment in local state
      const index = comments.value.findIndex(c => c.id === commentId)
      if (index !== -1) {
        comments.value[index] = updatedComment
      }
      return updatedComment
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || 'Failed to update answer'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Delete answer/comment
  async function deleteAnswer(commentId: number) {
    isLoading.value = true
    error.value = null
    try {
      await commentService.deleteComment(commentId)
      // Remove comment from local state
      comments.value = comments.value.filter(c => c.id !== commentId)
      // If deleted comment was best answer, clear it
      if (currentPost.value && currentPost.value.bestAnswerId === commentId) {
        currentPost.value.bestAnswerId = null
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || 'Failed to delete answer'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Set best answer
  async function setBestAnswer(postId: number, commentId: number) {
    isLoading.value = true
    error.value = null
    try {
      const updatedPost = await postService.setBestAnswer(postId, commentId)
      // Update post in local state
      if (currentPost.value?.id === postId) {
        currentPost.value = updatedPost
      }
      const index = posts.value.findIndex(p => p.id === postId)
      if (index !== -1) {
        posts.value[index] = updatedPost
      }
      // Update comments to reflect best answer status
      comments.value = comments.value.map(c => ({
        ...c,
        isBestAnswer: c.id === commentId,
      }))
      return updatedPost
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || 'Failed to set best answer'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Remove best answer
  async function removeBestAnswer(postId: number) {
    isLoading.value = true
    error.value = null
    try {
      const updatedPost = await postService.removeBestAnswer(postId)
      // Update post in local state
      if (currentPost.value?.id === postId) {
        currentPost.value = updatedPost
      }
      const index = posts.value.findIndex(p => p.id === postId)
      if (index !== -1) {
        posts.value[index] = updatedPost
      }
      // Update comments to remove best answer status
      comments.value = comments.value.map(c => ({
        ...c,
        isBestAnswer: false,
      }))
      return updatedPost
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || 'Failed to remove best answer'
      throw e
    } finally {
      isLoading.value = false
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
        answers: comments.value.map(c => ({
          ...c,
          isBestAnswer: currentPost.value.bestAnswerId === c.id,
        })),
      }
    }
    const post = posts.value.find((p) => p.id === id)
    if (!post) return null
    return {
      ...post,
      answers: comments.value
        .filter((c) => c.postId === id)
        .map(c => ({
          ...c,
          isBestAnswer: post.bestAnswerId === c.id,
        })),
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
    updatePost,
    deletePost,
    addAnswer,
    updateAnswer,
    deleteAnswer,
    voteAnswer,
    setBestAnswer,
    removeBestAnswer,
    fetchTags,
    postsWithMeta,
    postById,
    allTags,
  }
})
