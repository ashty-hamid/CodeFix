<template>
  <DefaultLayout>
    <section class="cf-container">
      <h1 style="margin:0 0 8px">Recent Error Posts</h1>
      <p style="color:var(--muted); margin:0 0 20px">
        Find solutions to coding problems or help others with theirs.
      </p>

      <!-- Simple tag filter -->
      <div style="margin-bottom:16px; display:flex; gap:12px; align-items:center">
        <label for="tag" style="color:var(--muted)">Filter by tag:</label>
        <select id="tag" v-model="selectedTag" class="cf-search" style="max-width:240px">
          <option value="">All Tags</option>
          <option v-for="t in tags" :key="t.id" :value="t.name">{{ t.name }}</option>
        </select>
      </div>

      <div style="display:grid; gap:20px">
        <article
          v-for="p in filtered"
          :key="p.id"
          class="card"
          style="background:#0b1220; border:1px solid var(--line); border-radius:12px; padding:16px;"
        >
          <header style="display:flex; justify-content:space-between; gap:12px; align-items:center">
            <h2 style="margin:0; font-size:18px;">
              <RouterLink :to="`/post/${p.id}`" class="cf-link" style="text-decoration:none">{{ p.title }}</RouterLink>
            </h2>
            <small style="color:var(--muted)">{{ formatDate(p.createdAt) }}</small>
          </header>

          <p style="color:var(--muted); margin:8px 0 12px">{{ p.excerpt ?? p.body.slice(0,120) + '…' }}</p>

          <!-- fake code preview box -->
          <pre v-if="p.body" style="background:#111827; color:#d1d5db; border:1px solid var(--line); border-radius:8px; padding:12px; overflow:auto; margin:0 0 12px">
{{ p.body.slice(0,140) }}{{ p.body.length > 140 ? '…' : '' }}
          </pre>

          <footer style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; justify-content:space-between">
            <div style="display:flex; gap:8px; flex-wrap:wrap">
              <span v-for="t in p.tags" :key="t.id" style="background:#111827; border:1px solid var(--line); color:var(--muted); padding:4px 10px; border-radius:999px; font-size:12px">
                {{ t.name }}
              </span>
            </div>

            <div style="display:flex; gap:16px; align-items:center; color:var(--muted)">
  <div style="display:flex; align-items:center; gap:6px;">
    <button @click.stop="vote(p.id, 1)"
            style="background:none; border:none; cursor:pointer; color:#4ade80; font-size:18px;">▲</button>
    <span>{{ p.voteScore }}</span>
    <button @click.stop="vote(p.id, -1)"
            style="background:none; border:none; cursor:pointer; color:#f87171; font-size:18px;">▼</button>
  </div>

  <span>💬 {{ p.answersCount }}</span>
</div>

          </footer>
        </article>
      </div>
    </section>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from "@/components/layouts/DefaultLayout.vue";
import { computed, ref } from "vue";
import { usePostsStore } from "@/stores/postsStore";
import { useAuthStore } from "@/stores/authStore";
const auth = useAuthStore();

function vote(postId: number, value: 1 | -1) {
  if (!auth.isLoggedIn) return alert("Login to vote.");
  store.votePost({ postId, userId: auth.user!.id, value });
}


const store = usePostsStore();
const tags = computed(() => store.allTags);
const selectedTag = ref<string>("");

const posts = computed(() => store.postsWithMeta);
const filtered = computed(() => {
  if (!selectedTag.value) return posts.value;
  return posts.value.filter(p => p.tags.some(t => t.name === selectedTag.value));
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}
</script>
