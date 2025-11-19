<template>
  <DefaultLayout>
    <section class="cf-container" style="padding-block: 40px">
      <div class="cf-center-card signup-card">
        <!-- Avatar -->
        <div class="avatar-circle">C</div>

        <h1 class="title">Join CodeFix</h1>
        <p class="subtitle">Create an account to get started</p>

        <!-- FORM -->
        <form class="form-grid" @submit.prevent="handleSignup">
          <!-- Full Name -->
          <label>Full Name *</label>
          <input
            v-model="fullName"
            type="text"
            placeholder="Enter your full name"
            class="input-field"
          />

          <!-- Username -->
          <label>Username *</label>
          <input
            v-model="username"
            type="text"
            placeholder="Choose a username"
            class="input-field"
          />

          <!-- Email -->
          <label>Email *</label>
          <input v-model="email" type="email" placeholder="Enter your email" class="input-field" />

          <!-- Password -->
          <label>Password *</label>
          <input
            v-model="password"
            type="password"
            placeholder="Enter your password"
            class="input-field"
          />

          <!-- Confirm Password -->
          <label>Confirm Password *</label>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            class="input-field"
          />

          <button class="cf-btn cf-btn-primary submit-btn">Create Account</button>
        </form>

        <p class="auth-switch">
          Already have an account?
          <RouterLink to="/login">Sign in</RouterLink>
        </p>
      </div>
    </section>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'

const fullName = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const auth = useAuthStore()
const router = useRouter()

function handleSignup() {
  if (!fullName.value || !username.value || !email.value || !password.value) {
    alert('Please fill all fields.')
    return
  }

  if (password.value !== confirmPassword.value) {
    alert('Passwords do not match.')
    return
  }

  // create user in auth store
  auth.signup({ name: fullName.value, email: email.value, password: password.value })

  // redirect to home after success
  router.push('/home')
}
</script>

<style scoped>
.signup-card {
  max-width: 520px;
  margin: auto;
  padding: 32px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: var(--panel);
}

.avatar-circle {
  width: 68px;
  height: 68px;
  border-radius: 999px;
  margin: 0 auto 16px;
  background: var(--brand);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28px;
  color: white;
  font-weight: bold;
}

.title {
  text-align: center;
  font-size: 26px;
  margin-bottom: 6px;
}

.subtitle {
  text-align: center;
  margin-bottom: 24px;
  color: var(--muted);
}

.form-grid {
  display: grid;
  gap: 8px;
}

.submit-btn {
  width: 100%;
  margin-top: 18px;
  height: 44px;
  font-size: 15px;
}

.auth-switch {
  text-align: center;
  margin-top: 14px;
  color: var(--muted);
}

.auth-switch a {
  color: var(--brand);
  font-weight: 500;
}

.input-field {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #111827;
  color: var(--text);
}
</style>
