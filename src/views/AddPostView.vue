<template>
  <DefaultLayout>
    <section class="cf-container">
      <h1 style="margin:0 0 8px">Share Your Coding Error</h1>
      <p style="color:var(--muted); margin:0 0 16px">Get help from the community by sharing your coding problem</p>

      <div v-if="!auth.isLoggedIn"
           style="background:#0b1220; border:1px solid var(--line); border-radius:12px; padding:24px; text-align:center;">
        <p style="margin:0 0 10px">Login Required</p>
        <p style="color:var(--muted); margin:0 0 16px">You need to be logged in to create a new post</p>
        <RouterLink :to="{ name: 'login', query: { redirect: '/add' } }">
          <button class="cf-btn cf-btn-primary">Login / Register</button>
        </RouterLink>
      </div>

      <form v-else @submit.prevent="submit" style="background:#0b1220; border:1px solid var(--line); border-radius:12px; padding:18px;">
        <label>Title *</label>
        <input v-model="title" required class="cf-search" style="display:block; max-width:none; width:100%; margin:6px 0 14px" placeholder="Brief description of your coding error"/>

        <label>Description *</label>
        <textarea v-model="body" rows="7" required
          style="width:100%; background:#111827; color:#e5e7eb; border:1px solid var(--line); border-radius:8px; padding:10px; margin:6px 0 14px"
          placeholder="Describe your coding error in detail."></textarea>

        <label>Tags (comma separated)</label>
        <input v-model="tags" class="cf-search" style="display:block; width:100%; margin:6px 0 16px" placeholder="e.g. javascript, vue, typescript"/>

        <div style="display:flex; gap:10px">
          <button type="button" class="cf-btn" @click="reset">Cancel</button>
          <button type="submit" class="cf-btn cf-btn-primary">Create Post</button>
        </div>
      </form>
    </section>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from "@/components/layouts/DefaultLayout.vue";
import { ref } from "vue";
import { usePostsStore } from "@/stores/postsStore";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "vue-router";

const posts = usePostsStore();
const auth = useAuthStore();
const router = useRouter();

const title = ref("");
const body = ref("");
const tags = ref("");

function reset(){ title.value=""; body.value=""; tags.value=""; }

function submit() {
  const tagNames = tags.value
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const id = posts.addPost({
    title: title.value.trim(),
    body: body.value.trim(),
    tagNames,
    authorId: auth.user!.id
  });

  reset();
  router.push("/");
}

</script>
