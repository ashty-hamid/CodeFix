<script setup>
import PageHeader from '@/components/PageHeader.vue'
import PageFooter from '@/components/PageFooter.vue'
</script>

<template>
  <div class="bg-gray-800 min-h-screen text-gray-50">
    <PageHeader />
    <main class="my-12">
      <RouterView />
    </main>
    <PageFooter />
  </div>
</template>
