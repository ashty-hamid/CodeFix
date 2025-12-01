<template>
  <DefaultLayout>
    <div class="cf-container" style="max-width: 650px; margin-top: 40px">
      <h1>{{ $t('support.title') }}</h1>

      <p style="color: var(--muted); margin-top: 10px">
        {{ $t('support.description') }}
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
        <h2 style="margin-bottom: 10px">{{ $t('support.donationDetails') }}</h2>
        <p><strong>{{ $t('support.bank') }}</strong> {{ $t('support.bankName') }}</p>
        <p><strong>{{ $t('support.accountName') }}</strong> {{ $t('support.accountNameValue') }}</p>
        <p><strong>{{ $t('support.fibNumber') }}</strong> {{ $t('support.fibNumberValue') }}</p>

        <p style="color: var(--muted); margin-top: 10px">
          {{ $t('support.donationNote') }}
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
            {{ $t('support.qrCodePlaceholder') }}
          </div>
          <small style="display: block; margin-top: 8px; color: var(--muted)">
            {{ $t('support.addQrLater') }}
          </small>
        </div>
      </div>

      <p style="margin-top: 25px; text-align: center; color: var(--muted)">
        {{ $t('support.thankYou') }}
      </p>
      <button @click="sendPayment">Send Payment</button>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import { fibService } from '@/services/fibService'

const sendPayment = async () => {
  const response = await fibService.authorize()
  // console.log(response)
}
</script>
