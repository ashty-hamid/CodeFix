<template>
  <div class="test-api">
    <h1>API Service Test</h1>

    <button @click="testGetUsers">Test Get Users</button>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-if="error" class="error">
      Error: {{ error }}
    </div>

    <div v-if="users.length > 0" class="users">
      <h2>Users:</h2>
      <ul>
        <li v-for="user in users" :key="user.id">
          {{ user.name }} - {{ user.email }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { userService } from '@/services/userService';
import type { User } from '@/types/api.types';

const users = ref<User[]>([]);
const loading = ref(false);
const error = ref('');

const testGetUsers = async () => {
  loading.value = true;
  error.value = '';

  try {
    const data = await userService.getUsers();
    users.value = data;
    console.log('Users fetched:', data);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
    error.value = errorMessage;
    console.error('Error:', err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.test-api {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  color: #42b983;
  margin-bottom: 20px;
}

button {
  padding: 12px 24px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background 0.3s;
}

button:hover {
  background: #369970;
}

button:active {
  transform: scale(0.98);
}

.loading {
  margin: 20px 0;
  padding: 15px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 6px;
  font-weight: 500;
}

.error {
  margin: 20px 0;
  padding: 15px;
  background: #ffebee;
  color: #c62828;
  border-radius: 6px;
  font-weight: 500;
}

.users {
  margin-top: 30px;
}

.users h2 {
  color: #333;
  margin-bottom: 15px;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 15px;
  margin: 10px 0;
  background: #f5f5f5;
  border-radius: 6px;
  border-left: 4px solid #42b983;
  transition: transform 0.2s, box-shadow 0.2s;
}

li:hover {
  transform: translateX(5px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
</style>
