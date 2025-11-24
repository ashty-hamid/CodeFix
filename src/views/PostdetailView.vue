<template>
  <DefaultLayout>
    <section class="cf-container">
      <!-- POST NOT FOUND -->
      <div v-if="!post" style="padding: 20px; color: var(--muted)">{{ $t('common.postNotFound') }}</div>

      <!-- POST CONTENT -->
      <div v-else>
        <!-- POST CARD -->
        <div
          style="
            background: #0b1220;
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
          "
        >
          <!-- HEADER -->
          <header style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px">
            <h1 style="margin: 0">{{ post.title }}</h1>
            <div style="display: flex; gap: 12px; align-items: center">
              <small style="color: var(--muted)">{{ formatDate(post.createdAt) }}</small>
              <!-- EDIT/DELETE BUTTONS (for admins and owners) -->
              <div v-if="canEditPost" style="display: flex; gap: 8px">
                <button @click="showEditPostModal = true" class="cf-btn" style="padding: 4px 12px; font-size: 12px">
                  {{ $t('common.edit') }}
                </button>
                <button @click="confirmDeletePost" class="cf-btn" style="padding: 4px 12px; font-size: 12px; background: rgba(255, 77, 77, 0.1); border-color: rgb(255, 77, 77); color: rgb(255, 120, 120)">
                  {{ $t('common.delete') }}
                </button>
              </div>
            </div>
          </header>

          <!-- AUTHOR -->
          <div style="margin-top: 6px; color: var(--muted)">
            {{ $t('common.postedBy') }}
            <RouterLink 
              v-if="post.author?.id" 
              :to="`/user/${post.author.id}`" 
              class="cf-link"
              style="margin-left: 4px"
            >
              {{ post.author.username }}
            </RouterLink>
            <span v-else style="margin-left: 4px">{{ $t('common.unknown') }}</span>
          </div>

          <!-- BODY -->
          <pre
            style="
              background: #111827;
              border: 1px solid var(--line);
              border-radius: 8px;
              padding: 12px;
              margin-top: 16px;
              overflow: auto;
              white-space: pre-wrap;
            "
            >{{ post.body }}
          </pre>

          <!-- TAGS -->
          <div style="margin-top: 14px; display: flex; gap: 10px; flex-wrap: wrap">
            <span
              v-for="t in (post.tags || []).filter((t: any) => t && t.id && t.name)"
              :key="t.id"
              style="
                background: #111827;
                border: 1px solid var(--line);
                padding: 4px 10px;
                border-radius: 999px;
                color: var(--muted);
                font-size: 12px;
              "
            >
              {{ t.name }}
            </span>
          </div>
        </div>

        <!-- ANSWERS SECTION -->
        <h3 style="margin-bottom: 10px">{{ $t('postDetail.answersCount', { count: post.answers.length }) }}</h3>

        <!-- IF NO ANSWERS -->
        <p v-if="post.answers.length === 0" style="color: var(--muted)">{{ $t('common.noAnswers') }}</p>

        <!-- ANSWER LIST -->
        <div
          v-for="ans in sortedAnswers"
          :key="ans.id"
          :style="{
            background: '#0b1220',
            border: '1px solid var(--line)',
            borderLeft: ans.isBestAnswer ? '4px solid #4ade80' : 'none',
            padding: '14px',
            borderRadius: '12px',
            marginBottom: '14px',
          }"
        >
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px">
            <!-- LEFT: best answer badge + author + date -->
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
              <span
                v-if="ans.isBestAnswer"
                style="
                  background: #4ade80;
                  color: #000;
                  padding: 4px 10px;
                  border-radius: 999px;
                  font-size: 11px;
                  font-weight: 600;
                  text-transform: uppercase;
                "
              >
                ✓ {{ $t('common.bestAnswer') }}
              </span>
              <span style="color: var(--muted)">
                <RouterLink 
                  v-if="ans.author?.id" 
                  :to="`/user/${ans.author.id}`" 
                  class="cf-link"
                >
                  {{ ans.author.username }}
                </RouterLink>
                <span v-else>{{ $t('common.unknown') }}</span>
                <span> • {{ formatDate(ans.createdAt) }}</span>
              </span>
            </div>

            <!-- RIGHT: voting + edit/delete + best answer button -->
            <div style="display: flex; gap: 6px; align-items: center">
              <!-- BEST ANSWER BUTTON (for post author or admin) -->
              <button
                v-if="canSetBestAnswer"
                @click="toggleBestAnswer(ans.id)"
                class="cf-btn"
                :style="{
                  padding: '4px 10px',
                  fontSize: '12px',
                  background: ans.isBestAnswer ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
                  borderColor: ans.isBestAnswer ? '#4ade80' : 'var(--line)',
                  color: ans.isBestAnswer ? '#4ade80' : 'var(--muted)',
                }"
                :title="ans.isBestAnswer ? $t('common.removeBestAnswer') : $t('common.markAsBestAnswer')"
              >
                {{ ans.isBestAnswer ? '★' : '☆' }}
              </button>

              <!-- EDIT/DELETE BUTTONS (for admins and owners) -->
              <div v-if="canEditAnswer(ans)" style="display: flex; gap: 6px; margin-right: 8px">
                <button @click="editAnswer(ans)" class="cf-btn" style="padding: 4px 10px; font-size: 12px">
                  {{ $t('common.edit') }}
                </button>
                <button @click="confirmDeleteAnswer(ans.id)" class="cf-btn" style="padding: 4px 10px; font-size: 12px; background: rgba(255, 77, 77, 0.1); border-color: rgb(255, 77, 77); color: rgb(255, 120, 120)">
                  {{ $t('common.delete') }}
                </button>
              </div>
              
              <button
                @click="voteAnswer(ans.id, 'upvote')"
                class="cf-btn"
                style="padding: 4px 10px"
              >
                ▲
              </button>

              <span>{{ ans.score }}</span>

              <button
                @click="voteAnswer(ans.id, 'downvote')"
                class="cf-btn"
                style="padding: 4px 10px"
              >
                ▼
              </button>
            </div>
          </div>

          <!-- ANSWER BODY -->
          <p style="margin-top: 10px">{{ ans.content }}</p>
        </div>

        <!-- ADD ANSWER -->
        <div style="margin-top: 24px">
          <h3>{{ $t('common.addAnswer') }}</h3>

          <!-- IF NOT LOGGED IN -->
          <p v-if="!auth.isLoggedIn" style="color: var(--muted); margin-top: 6px">
            {{ $t('common.please') }}
            <RouterLink :to="{ name: 'login', query: { redirect: route.fullPath } }"
              >{{ $t('common.logIn') }}</RouterLink
            >
            {{ $t('common.toWriteAnswer') }}
          </p>

          <!-- ANSWER FORM -->
          <div v-else>
            <textarea
              v-model="answerBody"
              rows="5"
              :placeholder="$t('common.writeAnswer')"
              style="
                width: 100%;
                background: #111827;
                border: 1px solid var(--line);
                padding: 12px;
                border-radius: 8px;
                color: white;
              "
            ></textarea>

            <button @click="submitAnswer" class="cf-btn cf-btn-primary" style="margin-top: 10px" :disabled="isLoading">
              {{ isLoading ? '...' : $t('common.submitAnswer') }}
            </button>
          </div>
        </div>
      </div>

      <!-- EDIT POST MODAL -->
      <div
        v-if="showEditPostModal"
        style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        "
        @click.self="showEditPostModal = false"
      >
        <div
          style="
            background: #0b1220;
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 24px;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
          "
        >
          <h2 style="margin: 0 0 20px">{{ $t('common.editPost') }}</h2>
          
          <form @submit.prevent="submitEditPost">
            <label style="font-weight: 500; display: block; margin-bottom: 6px">
              {{ $t('common.title') }} {{ $t('common.required') }}
            </label>
            <input
              v-model="editPostForm.title"
              required
              class="cf-search"
              style="display: block; width: 100%; margin-bottom: 16px"
            />

            <label style="font-weight: 500; display: block; margin-bottom: 6px">
              {{ $t('common.description') }} {{ $t('common.required') }}
            </label>
            <textarea
              v-model="editPostForm.body"
              required
              rows="7"
              style="
                width: 100%;
                background: #111827;
                color: #e5e7eb;
                border: 1px solid var(--line);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 16px;
              "
            ></textarea>

            <div style="display: flex; gap: 12px; justify-content: flex-end">
              <button type="button" @click="showEditPostModal = false" class="cf-btn">
                {{ $t('common.cancel') }}
              </button>
              <button type="submit" class="cf-btn cf-btn-primary" :disabled="isLoading">
                {{ isLoading ? '...' : $t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- EDIT ANSWER MODAL -->
      <div
        v-if="showEditAnswerModal"
        style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        "
        @click.self="showEditAnswerModal = false"
      >
        <div
          style="
            background: #0b1220;
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 24px;
            max-width: 600px;
            width: 90%;
          "
        >
          <h2 style="margin: 0 0 20px">{{ $t('common.editAnswer') }}</h2>
          
          <form @submit.prevent="submitEditAnswer">
            <label style="font-weight: 500; display: block; margin-bottom: 6px">
              {{ $t('common.content') }} {{ $t('common.required') }}
            </label>
            <textarea
              v-model="editAnswerForm.content"
              required
              rows="5"
              style="
                width: 100%;
                background: #111827;
                color: #e5e7eb;
                border: 1px solid var(--line);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 16px;
              "
            ></textarea>

            <div style="display: flex; gap: 12px; justify-content: flex-end">
              <button type="button" @click="showEditAnswerModal = false" class="cf-btn">
                {{ $t('common.cancel') }}
              </button>
              <button type="submit" class="cf-btn cf-btn-primary" :disabled="isLoading">
                {{ isLoading ? '...' : $t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- DELETE CONFIRMATION MODAL -->
      <div
        v-if="showDeleteConfirm"
        style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        "
        @click.self="showDeleteConfirm = false"
      >
        <div
          style="
            background: #0b1220;
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
          "
        >
          <h2 style="margin: 0 0 16px">{{ $t('common.confirmDelete') }}</h2>
          <p style="color: var(--muted); margin-bottom: 20px">
            {{ deleteConfirmMessage }}
          </p>
          <div style="display: flex; gap: 12px; justify-content: flex-end">
            <button @click="showDeleteConfirm = false" class="cf-btn">
              {{ $t('common.cancel') }}
            </button>
            <button @click="executeDelete" class="cf-btn" style="background: rgba(255, 77, 77, 0.1); border-color: rgb(255, 77, 77); color: rgb(255, 120, 120)">
              {{ $t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import { usePostsStore } from '@/stores/postsStore'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const store = usePostsStore()
const auth = useAuthStore()

const postId = Number(route.params.id)

const post = ref<any>(null)

const answerBody = ref('')
const isLoading = ref(false)

// Edit/Delete state
const showEditPostModal = ref(false)
const showEditAnswerModal = ref(false)
const showDeleteConfirm = ref(false)
const deleteConfirmType = ref<'post' | 'answer' | null>(null)
const deleteConfirmId = ref<number | null>(null)
const editingAnswerId = ref<number | null>(null)

const editPostForm = ref({
  title: '',
  body: '',
})

const editAnswerForm = ref({
  content: '',
})

// Check if current user can edit/delete post
const canEditPost = computed(() => {
  if (!auth.isLoggedIn || !post.value) return false
  return auth.user?.role === 'admin' || post.value.author?.id === auth.user?.id
})

// Check if current user can set best answer (post author or admin)
const canSetBestAnswer = computed(() => {
  if (!auth.isLoggedIn || !post.value) return false
  return auth.user?.role === 'admin' || post.value.author?.id === auth.user?.id
})

// Check if current user can edit/delete answer
function canEditAnswer(answer: any) {
  if (!auth.isLoggedIn) return false
  return auth.user?.role === 'admin' || answer.author?.id === auth.user?.id
}

// Sort answers to show best answer first
const sortedAnswers = computed(() => {
  if (!post.value || !post.value.answers) return []
  const answers = [...post.value.answers]
  return answers.sort((a, b) => {
    // Best answer first
    if (a.isBestAnswer && !b.isBestAnswer) return -1
    if (!a.isBestAnswer && b.isBestAnswer) return 1
    // Then by score (highest first)
    if (a.score !== b.score) return b.score - a.score
    // Then by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

// Fetch post on mount and when route changes
async function loadPost() {
  try {
    await store.fetchPostById(postId)
    post.value = store.postById(postId)
  } catch (e) {
    console.error('Failed to fetch post:', e)
  }
}

onMounted(() => {
  loadPost()
})

// Watch for route changes (e.g., when navigating to the same post)
watch(() => route.params.id, (newId) => {
  if (newId && Number(newId) === postId) {
    loadPost()
  }
})

async function submitAnswer() {
  if (!auth.isLoggedIn) {
    return router.push({ name: 'login', query: { redirect: route.fullPath } })
  }

  if (!answerBody.value.trim()) return

  isLoading.value = true
  try {
    await store.addAnswer({
      postId,
      content: answerBody.value.trim(),
    })
    // Refresh post to get updated comments
    await store.fetchPostById(postId)
    post.value = store.postById(postId)
    answerBody.value = ''
  } catch (e) {
    console.error('Failed to submit answer:', e)
  } finally {
    isLoading.value = false
  }
}

async function voteAnswer(commentId: number, type: 'upvote' | 'downvote') {
  if (!auth.isLoggedIn) {
    return router.push({ name: 'login', query: { redirect: route.fullPath } })
  }

  try {
    await store.voteAnswer({
      commentId,
      type,
    })
    // Refetch post to get updated best answer and comment scores
    await store.fetchPostById(postId)
    post.value = store.postById(postId)
  } catch (e) {
    console.error('Failed to vote:', e)
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

// Edit post functions
async function submitEditPost() {
  if (!post.value) return
  isLoading.value = true
  try {
    await store.updatePost(postId, {
      title: editPostForm.value.title.trim(),
      body: editPostForm.value.body.trim(),
    })
    // Refresh post
    await store.fetchPostById(postId)
    post.value = store.postById(postId)
    showEditPostModal.value = false
  } catch (e) {
    console.error('Failed to update post:', e)
  } finally {
    isLoading.value = false
  }
}

// Delete post functions
function confirmDeletePost() {
  deleteConfirmType.value = 'post'
  deleteConfirmId.value = postId
  showDeleteConfirm.value = true
}

// Edit answer functions
function editAnswer(answer: any) {
  editingAnswerId.value = answer.id
  editAnswerForm.value = {
    content: answer.content,
  }
  showEditAnswerModal.value = true
}

async function submitEditAnswer() {
  if (!editingAnswerId.value) return
  isLoading.value = true
  try {
    await store.updateAnswer({
      commentId: editingAnswerId.value,
      content: editAnswerForm.value.content.trim(),
    })
    // Refresh post to get updated comments
    await store.fetchPostById(postId)
    post.value = store.postById(postId)
    showEditAnswerModal.value = false
    editingAnswerId.value = null
  } catch (e) {
    console.error('Failed to update answer:', e)
  } finally {
    isLoading.value = false
  }
}

// Delete answer functions
function confirmDeleteAnswer(answerId: number) {
  deleteConfirmType.value = 'answer'
  deleteConfirmId.value = answerId
  showDeleteConfirm.value = true
}

const deleteConfirmMessage = computed(() => {
  if (deleteConfirmType.value === 'post') {
    return 'Are you sure you want to delete this post? This action cannot be undone.'
  }
  return 'Are you sure you want to delete this answer? This action cannot be undone.'
})

async function executeDelete() {
  if (!deleteConfirmId.value || !deleteConfirmType.value) return
  isLoading.value = true
  try {
    if (deleteConfirmType.value === 'post') {
      await store.deletePost(deleteConfirmId.value)
      // Redirect to home after deleting post
      router.push('/')
    } else {
      await store.deleteAnswer(deleteConfirmId.value)
      // Refresh post to get updated comments
      await store.fetchPostById(postId)
      post.value = store.postById(postId)
    }
    showDeleteConfirm.value = false
    deleteConfirmType.value = null
    deleteConfirmId.value = null
  } catch (e) {
    console.error('Failed to delete:', e)
  } finally {
    isLoading.value = false
  }
}

// Toggle best answer
async function toggleBestAnswer(commentId: number) {
  if (!auth.isLoggedIn || !post.value) {
    return router.push({ name: 'login', query: { redirect: route.fullPath } })
  }

  if (!canSetBestAnswer.value) return

  isLoading.value = true
  try {
    if (post.value.bestAnswerId === commentId) {
      // Remove best answer
      await store.removeBestAnswer(postId)
    } else {
      // Set best answer
      await store.setBestAnswer(postId, commentId)
    }
    // Refresh post to get updated data
    await store.fetchPostById(postId)
    post.value = store.postById(postId)
  } catch (e) {
    console.error('Failed to toggle best answer:', e)
  } finally {
    isLoading.value = false
  }
}

// Initialize edit post modal when showEditPostModal becomes true
watch(showEditPostModal, (newVal) => {
  if (newVal && post.value) {
    editPostForm.value = {
      title: post.value.title,
      body: post.value.body,
    }
  }
})
</script>
