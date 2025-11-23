<template>
  <DefaultLayout>
    <section class="cf-container" style="padding-block: 40px">
      <div class="cf-center-card signup-card">
        <!-- Avatar -->
        <div class="avatar-circle">C</div>

        <h1 class="title">{{ $t('signup.joinCodeFix') }}</h1>
        <p class="subtitle">{{ $t('signup.createAccount') }}</p>

        <!-- FORM -->
        <form class="form-grid" @submit.prevent="handleSignup">
          <!-- Full Name -->
          <label>{{ $t('common.fullName') }} {{ $t('common.required') }}</label>
          <input
            v-model="fullName"
            type="text"
            :placeholder="$t('signup.enterFullName')"
            class="input-field"
          />

          <!-- Username -->
          <label>{{ $t('common.username') }} {{ $t('common.required') }}</label>
          <input
            v-model="username"
            type="text"
            :placeholder="$t('signup.chooseUsername')"
            class="input-field"
          />

          <!-- Email -->
          <label>{{ $t('common.email') }} {{ $t('common.required') }}</label>
          <input v-model="email" type="email" :placeholder="$t('signup.enterEmail')" class="input-field" />

          <!-- Password -->
          <label>{{ $t('common.password') }} {{ $t('common.required') }}</label>
          <input
            v-model="password"
            type="password"
            :placeholder="$t('signup.enterPassword')"
            class="input-field"
          />

          <!-- Confirm Password -->
          <label>{{ $t('common.confirmPassword') }} {{ $t('common.required') }}</label>
          <input
            v-model="confirmPassword"
            type="password"
            :placeholder="$t('signup.confirmPassword')"
            class="input-field"
          />

          <button class="cf-btn cf-btn-primary submit-btn">{{ $t('signup.createAccountButton') }}</button>
        </form>

        <p class="auth-switch">
          {{ $t('signup.alreadyHaveAccount') }}
          <RouterLink to="/login">{{ $t('signup.signInLink') }}</RouterLink>
        </p>
      </div>
    </section>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'

const fullName = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const auth = useAuthStore()
const router = useRouter()

const { t } = useI18n()

async function handleSignup() {
  if (!fullName.value || !username.value || !email.value || !password.value) {
    alert(t('signup.fillAllFields'))
    return
  }

  if (password.value !== confirmPassword.value) {
    alert(t('signup.passwordsDoNotMatch'))
    return
  }

  try {
    // create user via API
    await auth.signup({ 
      username: username.value || fullName.value, 
      email: email.value, 
      password: password.value 
    })

    // redirect to home after success
    router.push('/home')
  } catch (e: any) {
    alert(auth.error || e.message || 'Registration failed')
  }
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
