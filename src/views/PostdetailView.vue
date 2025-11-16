<template>
  <DefaultLayout>
    <section class="cf-container" v-if="post">
      <div style="background:#0b1220; border:1px solid var(--line); border-radius:12px; padding:18px; margin-bottom:16px">
        <header style="display:flex; justify-content:space-between; align-items:center; gap:12px">
          <h1 style="margin:0">{{ post.title }}</h1>
          <small style="color:var(--muted)">{{ formatDate(post.createdAt) }}</small>
        </header>
        <div style="display:flex; gap:10px; align-items:center; margin-top:8px; color:var(--muted)">
          <span>by {{ post.author?.username ?? 'unknown' }}</span>
        </div>

        <h3 style="margin:16px 0 8px; font-size:16px; color:#cbd5e1">Code Snippet</h3>
        <pre style="background:#111827; color:#d1d5db; border:1px solid var(--line); border-radius:8px; padding:12px; overflow:auto">{{ post.body }}</pre>

        <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap">
          <span v-for="t in post.tags" :key="t.id" style="background:#111827; border:1px solid var(--line); color:var(--muted); padding:4px 10px; border-radius:999px; font-size:12px">
            {{ t.name }}
          </span>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; margin-bottom:10px">
        <button class="cf-btn cf-btn-primary" @click="onAddAnswer">Add Answer</button>
      </div>

      <!-- Answer editor -->
      <div v-if="showEditor" style="background:#0b1220; border:1px solid var(--line); border-radius:12px; padding:16px; margin-bottom:16px">
        <h3 style="margin:0 0 8px">Your Answer</h3>
        <textarea v-model="answer" placeholder="Share your solution or helpful advice..." rows="5"
          style="width:100%; background:#111827; color:#e5e7eb; border:1px solid var(--line); border-radius:8px; padding:10px"></textarea>
        <div style="display:flex; gap:10px; margin-top:10px">
          <button class="cf-btn" @click="cancelEditor">Cancel</button>
          <button class="cf-btn cf-btn-primary" @click="submitAnswer">Post Answer</button>
        </div>
      </div>

      <h3 style="margin:0 0 10px">Answers ({{ post.comments.length }})</h3>
      <div v-if="post.comments.length === 0" style="color:var(--muted)">No answers yet.</div>

      <div v-for="c in post.comments" :key="c.id"
           style="background:#0b1220; border:1px solid var(--line); border-radius:12px; padding:14px; margin-bottom:12px">
        <div style="display:flex; justify-content:space-between; align-items:center; color:var(--muted); margin-bottom:6px">
          <span>{{ c.author?.username ?? 'unknown' }} • {{ formatDate(c.createdAt) }}</span>
          <div style="display:flex; gap:8px; align-items:center">
            <button class="cf-btn" @click="vote(c.id,'upvote')">▲ {{ c.upvotes }}</button>
            <button class="cf-btn" @click="vote(c.id,'downvote')">▼ {{ c.downvotes }}</button>
          </div>
        </div>
        <p style="margin:0">{{ c.content }}</p>
      </div>
    </section>

    <section v-else class="cf-container">Post not found.</section>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from "@/components/layouts/DefaultLayout.vue";
import { useRoute, useRouter } from "vue-router";
import { computed, ref } from "vue";
import { usePostsStore } from "@/stores/postsStore";
import { useAuthStore } from "@/stores/authStore";

const route = useRoute();
const router = useRouter();
const posts = usePostsStore();
const auth = useAuthStore();

const id = Number(route.params.id);
const post = computed(() => posts.postById(id));

const showEditor = ref(false);
const answer = ref("");

function onAddAnswer() {
  if (!auth.isLoggedIn) {
    router.push({ name: "login", query: { redirect: route.fullPath } });
    return;
  }
  showEditor.value = true;
}

function cancelEditor() { showEditor.value = false; answer.value = ""; }

function submitAnswer() {
  if (!answer.value.trim()) return;
  posts.addAnswer({ postId: id, content: answer.value.trim(), authorId: auth.user!.id });
  answer.value = "";
  showEditor.value = false;
}

function vote(commentId: number, type: "upvote" | "downvote") {
  if (!auth.isLoggedIn) {
    router.push({ name: "login", query: { redirect: route.fullPath } });
    return;
  }
  posts.voteComment({ commentId, userId: auth.user!.id, type });
}

function formatDate(iso: string) { return new Date(iso).toLocaleDateString(); }
</script>
