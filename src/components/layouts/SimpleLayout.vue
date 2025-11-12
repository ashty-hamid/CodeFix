<template>
  <div class="cf-app">
    <Navbar />
    <main class="cf-main">
      <div class="cf-center-card">
        <slot />
      </div>
    </main>
    <PageFooter />
  </div>
</template>

<script setup lang="ts">
import Navbar from "@/components/Navbar.vue";
import PageFooter from "@/components/PageFooter.vue";
</script>
