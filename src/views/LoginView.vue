<template>
  <SimpleLayout>
    <div style="text-align: center; margin-bottom: 20px;">
      <div
        style="
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--brand-strong);
          margin: 0 auto 12px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          font-size: 22px;
          font-weight: 600;
        "
      >
        C
      </div>

      <h2 style="margin: 0 0 8px">{{ $t('login.welcomeBack') }}</h2>
      <p class="cf-muted" style="margin: 0">{{ $t('login.signInToAccount') }}</p>
    </div>

    <!-- FORM -->
    <form @submit.prevent="submit">
      <label class="cf-label">{{ $t('common.email') }} {{ $t('common.required') }}</label>
      <input
        type="email"
        v-model="email"
        class="cf-input"
        :placeholder="$t('login.enterEmail')"
        required
      />

      <label class="cf-label" style="margin-top: 16px">{{ $t('common.password') }} {{ $t('common.required') }}</label>
      <input
        type="password"
        v-model="password"
        class="cf-input"
        :placeholder="$t('login.enterPassword')"
        required
      />

      <p v-if="error" class="error-box">{{ error }}</p>

      <button type="submit" class="cf-btn cf-btn-primary" style="width: 100%; margin-top: 20px;">
        {{ $t('common.signIn') }}
      </button>
    </form>

    <p style="margin-top: 16px; text-align: center;" class="cf-muted">
      {{ $t('login.dontHaveAccount') }}
      <RouterLink to="/signup" style="color: var(--brand);">{{ $t('login.signUpLink') }}</RouterLink>
    </p>
  </SimpleLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import SimpleLayout from "@/components/layouts/SimpleLayout.vue";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref("");
const password = ref("");
const error = ref("");

async function submit() {
  try {
    error.value = '';
    await auth.login({ email: email.value, password: password.value });

    const redirect = (route.query.redirect as string) || "/home";
    router.push(redirect);
  } catch (e: any) {
    error.value = auth.error || e.message || 'Login failed';
  }
}
</script>

<style scoped>
.cf-muted {
  color: var(--muted);
}

.cf-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
}

.cf-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #111827;
  color: var(--text);
}

.error-box {
  background: rgba(255, 77, 77, 0.1);
  border: 1px solid rgb(255, 77, 77);
  color: rgb(255, 120, 120);
  padding: 8px 12px;
  border-radius: 8px;
  margin-top: 14px;
  font-size: 14px;
}
</style>
