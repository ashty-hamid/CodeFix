<template>
  <DefaultLayout>
    <section class="cf-container">
      <h1 style="margin: 0 0 10px">{{ $t('addPost.shareError') }}</h1>
      <p style="color: var(--muted); margin: 0 0 20px">
        {{ $t('addPost.getHelp') }}
      </p>

      <!-- LOGIN REQUIRED -->
      <div
        v-if="!auth.isLoggedIn"
        style="
          background: #0b1220;
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
        "
      >
        <h2 style="margin-bottom: 10px">{{ $t('addPost.loginRequired') }}</h2>
        <p style="color: var(--muted); margin-bottom: 20px">
          {{ $t('addPost.mustBeLoggedIn') }}
        </p>

        <RouterLink :to="{ name: 'login', query: { redirect: '/add' } }">
          <button class="cf-btn cf-btn-primary">{{ $t('common.loginRegister') }}</button>
        </RouterLink>
      </div>

      <!-- FORM -->
      <form
        v-else
        @submit.prevent="submit"
        style="
          background: #0b1220;
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 24px;
        "
      >
        <!-- TITLE -->
        <label style="font-weight: 500">{{ $t('common.title') }} {{ $t('common.required') }}</label>
        <input
          v-model="title"
          required
          class="cf-search"
          style="display: block; width: 100%; margin: 6px 0 16px"
          :placeholder="$t('addPost.briefDescription')"
        />

        <!-- DESCRIPTION -->
        <label style="font-weight: 500">{{ $t('common.description') }} {{ $t('common.required') }}</label>
        <textarea
          v-model="body"
          required
          rows="7"
          style="
            width: 100%;
            background: #111827;
            color: #e5e7eb;
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 12px;
            margin: 6px 0 16px;
          "
          :placeholder="$t('addPost.describeError')"
        ></textarea>

        <!-- TAGS -->
        <label style="font-weight: 500">{{ $t('addPost.tagsCommaSeparated') }}</label>
        <input
          v-model="tags"
          class="cf-search"
          style="width: 100%; margin: 6px 0 20px"
          :placeholder="$t('addPost.tagsExample')"
        />

        <!-- BUTTONS -->
        <div style="display: flex; gap: 12px">
          <button type="button" class="cf-btn" @click="resetForm">{{ $t('common.cancel') }}</button>
          <button type="submit" class="cf-btn cf-btn-primary">{{ $t('addPost.createPost') }}</button>
        </div>
      </form>
    </section>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/postsStore'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const posts = usePostsStore()
const auth = useAuthStore()

const title = ref('')
const body = ref('')
const tags = ref('')

// Fetch tags on mount to enable tag selection
onMounted(async () => {
  if (posts.allTags.length === 0) {
    await posts.fetchTags()
  }
})

// RESET FORM
function resetForm() {
  title.value = ''
  body.value = ''
  tags.value = ''
}

// SUBMIT
async function submit() {
  if (!auth.isLoggedIn) {
    return router.push({ name: 'login', query: { redirect: '/add' } })
  }

  try {
    // Parse tag names from comma-separated input
    const tagNames = tags.value
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    // Send tag names directly - server will create tags that don't exist
    const newPost = await posts.addPost({
      title: title.value.trim(),
      body: body.value.trim(),
      tags: tagNames.length > 0 ? tagNames : undefined,
    })

    // Reset form
    resetForm()

    // go to the new post
    router.push(`/post/${newPost.id}`)
  } catch (e: any) {
    alert(posts.error || e.message || 'Failed to create post')
  }
}
</script>
