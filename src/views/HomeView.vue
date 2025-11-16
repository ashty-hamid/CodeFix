<template>
  <DefaultLayout>
    <section class="cf-container">
      <h1>Recent Error Posts</h1>
      <p class="cf-muted">Member 2 will render the list here.</p>
    </section>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/components/layouts/DefaultLayout.vue";
</script>
<style scoped>
.cf-muted{ color: var(--muted); }
</style>
