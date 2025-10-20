<script setup></script>

<template>
  <header class="min-w-screen bg-gray-900/75 p-6 flex items-center justify-between">
    <div class="text-2xl">LOGO</div>
    <nav class="">Hello from header navigation</nav>
    <div class="flex items-center gap-4">
      <RouterLink to="/login" class="nav-link">Login</RouterLink>
      <RouterLink :to="{ name: 'Signup' }" class="nav-link">Signup</RouterLink>
    </div>
  </header>
</template>

<style scoped>
@reference "tailwindcss";
.nav-link {
  @apply px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700;
}
</style>
