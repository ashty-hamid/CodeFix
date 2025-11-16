<template>
  <DefaultLayout>
    <section class="cf-container" v-if="post">

      <!-- POST DETAILS -->
      <div style="background:#0b1220; border:1px solid var(--line); border-radius:12px; padding:18px; margin-bottom:20px">
        <header style="display:flex; justify-content:space-between; align-items:center;">
          <h1>{{ post.title }}</h1>
          <small style="color:var(--muted)">{{ formatDate(post.createdAt) }}</small>
        </header>

        <div style="margin:8px 0; color:var(--muted)">
          Posted by {{ post.author?.username ?? "unknown" }}
        </div>

        <pre style="background:#111827; border:1px solid var(--line); border-radius:8px; padding:12px; margin-top:12px;">
{{ post.body }}
        </pre>

        <div style="display:flex; gap:10px; margin-top:14px;">
          <button @click="votePost(1)" class="cf-btn">▲</button>
          <span style="align-self:center">{{ post.voteScore }}</span>
          <button @click="votePost(-1)" class="cf-btn">▼</button>
        </div>

        <div style="margin-top:14px;">
          <span v-for="t in post.tags" :key="t.id"
                style="background:#111827; padding:4px 10px; border-radius:999px; margin-right:8px;">
            {{ t.name }}
          </span>
        </div>
      </div>

      <!-- ANSWERS -->
      <h3 style="margin-bottom:10px;">Answers ({{ post.answers.length }})</h3>

      <div v-if="post.answers.length === 0" style="color:var(--muted)">No answers yet.</div>

      <div v-for="a in post.answers" :key="a.id"
          style="background:#0b1220; border:1px solid var(--line); padding:14px; border-radius:12px; margin-bottom:14px;">

        <div style="display:flex; justify-content:space-between; align-items:center; color:var(--muted)">
          <span>{{ a.author?.username ?? 'unknown' }} • {{ formatDate(a.createdAt) }}</span>

          <div style="display:flex; gap:6px;">
            <button @click="voteAns(a.id, 1)" class="cf-btn">▲</button>
            <span style="align-self:center">{{ a.voteScore }}</span>
            <button @click="voteAns(a.id, -1)" class="cf-btn">▼</button>
          </div>
        </div>

        <p style="margin-top:8px;">{{ a.body }}</p>
      </div>

      <!-- ADD ANSWER -->
      <div v-if="auth.isLoggedIn" style="margin-top:20px;">
        <textarea v-model="answerBody"
                  placeholder="Write your answer..."
                  rows="4"
                  style="width:100%; background:#111827; padding:10px; border-radius:8px;"></textarea>

        <button @click="submitAnswer" class="cf-btn cf-btn-primary" style="margin-top:10px;">
          Submit Answer
        </button>
      </div>
      <p v-else style="color:var(--muted)">Login to write an answer.</p>

    </section>

    <section v-else class="cf-container">Post not found.</section>
  </DefaultLayout>
</template>


<script setup lang="ts">
import DefaultLayout from "@/components/layouts/DefaultLayout.vue";
import { useRoute, useRouter } from "vue-router";
import { computed, ref, watch } from "vue";
import { usePostsStore } from "@/stores/postsStore";
import { useAuthStore } from "@/stores/authStore";

// -------------------------------------------------
// STORES + ROUTER
// -------------------------------------------------
const route = useRoute();
const router = useRouter();
const posts = usePostsStore();
const auth = useAuthStore();

// -------------------------------------------------
// LOAD POST
// -------------------------------------------------
const id = Number(route.params.id);

// always load post when entering route
posts.fetchPostById(id);

const post = computed(() => posts.postById(id));

// -------------------------------------------------
// ANSWER EDITOR
// -------------------------------------------------
const showEditor = ref(false);
const answer = ref("");

addAnswer({ postId, content, authorId }) {
  const id = this.answers.length + 1;

  this.answers.push({
    id,
    postId,
    body: content,   // store as body
    content,         // also store as content to match UI usage
    authorId,
    createdAt: new Date().toISOString(),
  });
}


function cancelEditor() {
  showEditor.value = false;
  answer.value = "";
}

async function submitAnswer() {
  if (!answer.value.trim()) return;

  await posts.addAnswer({
    postId: id,
    content: answer.value.trim(),
    authorId: auth.user!.id
  });

  // refresh post so UI updates instantly
  await posts.fetchPostById(id);

  answer.value = "";
  showEditor.value = false;
}

// -------------------------------------------------
// COMMENT VOTING
// -------------------------------------------------
async function vote(commentId: number, type: "upvote" | "downvote") {
  if (!auth.isLoggedIn) {
    router.push({ name: "login", query: { redirect: route.fullPath } });
    return;
  }

  await posts.voteComment({
    commentId,
    userId: auth.user!.id,
    type
  });

  // refresh the post after votes
  await posts.fetchPostById(id);
}

// -------------------------------------------------
// HELPERS
// -------------------------------------------------
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}
</script>

