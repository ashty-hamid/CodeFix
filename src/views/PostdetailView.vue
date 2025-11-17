<template>
  <DefaultLayout>
    <section class="cf-container">
      <!-- POST NOT FOUND -->
      <div v-if="!post" style="padding: 20px; color: var(--muted)">Post not found.</div>

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
          <header style="display: flex; justify-content: space-between; align-items: center">
            <h1 style="margin: 0">{{ post.title }}</h1>
            <small style="color: var(--muted)">{{ formatDate(post.createdAt) }}</small>
          </header>

          <!-- AUTHOR -->
          <div style="margin-top: 6px; color: var(--muted)">
            Posted by {{ post.author?.username ?? 'Unknown' }}
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
              v-for="t in post.tags"
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
        <h3 style="margin-bottom: 10px">Answers ({{ post.answers.length }})</h3>

        <!-- IF NO ANSWERS -->
        <p v-if="post.answers.length === 0" style="color: var(--muted)">No answers yet.</p>

        <!-- ANSWER LIST -->
        <div
          v-for="ans in post.answers"
          :key="ans.id"
          style="
            background: #0b1220;
            border: 1px solid var(--line);
            padding: 14px;
            border-radius: 12px;
            margin-bottom: 14px;
          "
        >
          <div style="display: flex; justify-content: space-between; align-items: center">
            <!-- LEFT: author + date -->
            <span style="color: var(--muted)">
              {{ ans.author?.username ?? 'Unknown' }} • {{ formatDate(ans.createdAt) }}
            </span>

            <!-- RIGHT: voting -->
            <div style="display: flex; gap: 6px; align-items: center">
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
          <h3>Add Answer</h3>

          <!-- IF NOT LOGGED IN -->
          <p v-if="!auth.isLoggedIn" style="color: var(--muted); margin-top: 6px">
            Please
            <RouterLink :to="{ name: 'login', query: { redirect: route.fullPath } }"
              >log in</RouterLink
            >
            to write an answer.
          </p>

          <!-- ANSWER FORM -->
          <div v-else>
            <textarea
              v-model="answerBody"
              rows="5"
              placeholder="Write your answer..."
              style="
                width: 100%;
                background: #111827;
                border: 1px solid var(--line);
                padding: 12px;
                border-radius: 8px;
                color: white;
              "
            ></textarea>

            <button @click="submitAnswer" class="cf-btn cf-btn-primary" style="margin-top: 10px">
              Submit Answer
            </button>
          </div>
        </div>
      </div>
    </section>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import { usePostsStore } from '@/stores/postsStore'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const store = usePostsStore()
const auth = useAuthStore()

const postId = Number(route.params.id)

const post = computed(() => store.postById(postId))

const answerBody = ref('')

function submitAnswer() {
  if (!auth.isLoggedIn) {
    return router.push({ name: 'login', query: { redirect: route.fullPath } })
  }

  if (!answerBody.value.trim()) return

  store.addAnswer({
    postId,
    content: answerBody.value.trim(),
    authorId: auth.user!.id,
  })

  answerBody.value = ''
}

function voteAnswer(commentId: number, type: 'upvote' | 'downvote') {
  if (!auth.isLoggedIn) {
    return router.push({ name: 'login', query: { redirect: route.fullPath } })
  }

  store.voteAnswer({
    commentId,
    userId: auth.user!.id,
    type,
  })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}
</script>
