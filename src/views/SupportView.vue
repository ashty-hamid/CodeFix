<template>
  <DefaultLayout>
    <div class="cf-container" style="max-width: 650px; margin-top: 40px">
      <h1>Support CodeFix</h1>

      <p style="color: var(--muted); margin-top: 10px">
        CodeFix is a free community platform created to help developers solve coding problems, share
        knowledge, and support each other. If you appreciate our work and want to help us keep the
        platform running, you can support us through FIB.
      </p>

      <div
        style="
          background: #0b1220;
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 20px;
          margin-top: 25px;
        "
      >
        <h2 style="margin-bottom: 10px">FIB Donation Details</h2>
        <p><strong>Bank:</strong> Fast Iraq Bank (FIB)</p>
        <p><strong>Account Name:</strong> CodeFix Team</p>
        <p><strong>FIB Number:</strong> 07xx-xxxxxxx</p>

        <p style="color: var(--muted); margin-top: 10px">
          Any amount, big or small, helps us cover hosting, development and future community
          features.
        </p>

        <div style="margin-top: 20px; text-align: center">
          <div
            style="
              width: 140px;
              height: 140px;
              background: #111827;
              border: 1px solid var(--line);
              margin: 0 auto;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--muted);
            "
          >
            QR CODE HERE
          </div>
          <small style="display: block; margin-top: 8px; color: var(--muted)">
            (Add actual QR later)
          </small>
        </div>
      </div>

      <p style="margin-top: 25px; text-align: center; color: var(--muted)">
        Thank you for supporting CodeFix and helping us grow. ❤️
      </p>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
</script>
