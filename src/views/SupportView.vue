<template>
  <DefaultLayout>
    <div class="support-container">
      <!-- Hero Section -->
      <div class="support-hero">
        <div class="hero-icon">💝</div>
        <h1 class="support-title">{{ $t('support.title') }}</h1>
        <p class="support-description">
          {{ $t('support.description') }}
        </p>
      </div>

      <!-- Payment Form Section -->
      <div class="payment-card">
        <div class="card-header">
          <h2>{{ $t('support.createPayment') }}</h2>
          <p class="card-subtitle">{{ $t('support.enterAmount') }}</p>
        </div>

        <div class="payment-form">
          <div class="form-group">
            <label for="amount">{{ $t('support.amount') }} (IQD)</label>
            <div class="input-wrapper">
              <input
                id="amount"
                v-model.number="paymentAmount"
                type="number"
                min="1"
                step="1"
                :placeholder="$t('support.amountPlaceholder')"
                class="amount-input"
                :disabled="isPaymentLoading"
              />
            </div>
          </div>

          <button
            @click="createPayment"
            class="payment-button"
            :disabled="isPaymentLoading || !paymentAmount || paymentAmount <= 0"
          >
            <span v-if="isPaymentLoading" class="button-loading">
              <span class="spinner-small"></span>
              {{ $t('support.creating') }}
            </span>
            <span v-else>{{ $t('support.createPaymentButton') }}</span>
          </button>
        </div>
      </div>

      <!-- Payment Details Section -->
      <div v-if="paymentDetails" class="payment-details-card">
        <div class="card-header">
          <h2>{{ $t('support.paymentDetails') }}</h2>
          <div class="payment-status" :class="paymentStatusClass">
            <span class="status-dot"></span>
            {{ paymentStatusText }}
          </div>
        </div>

        <!-- QR Code Display -->
        <div class="qr-section">
          <div class="qr-container">
            <div v-if="qrCode" class="qr-code-wrapper">
              <img :src="qrCode" alt="Payment QR Code" class="qr-code-image" />
            </div>
            <div v-else class="qr-placeholder">
              <div class="qr-icon">📱</div>
              <p>{{ $t('support.qrCodePlaceholder') }}</p>
            </div>
          </div>

          <div v-if="readableCode" class="readable-code-section">
            <label class="code-label">{{ $t('support.paymentCode') }}</label>
            <div class="code-display">
              <code class="payment-code">{{ readableCode }}</code>
              <button @click="copyCode" class="copy-button" :title="$t('support.copyCode')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Bank Details -->
        <div class="bank-details">
          <h3 class="bank-details-title">{{ $t('support.donationDetails') }}</h3>
          <div class="bank-info-grid">
            <div class="bank-info-item">
              <span class="info-label">{{ $t('support.bank') }}</span>
              <div class="info-value-wrapper">
                <span class="info-value">{{ $t('support.bankName') }}</span>
                <button @click="copyToClipboard($t('support.bankName'))" class="info-copy-btn" :title="$t('support.copy')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div class="bank-info-item">
              <span class="info-label">{{ $t('support.accountName') }}</span>
              <div class="info-value-wrapper">
                <span class="info-value">{{ $t('support.accountNameValue') }}</span>
                <button @click="copyToClipboard($t('support.accountNameValue'))" class="info-copy-btn" :title="$t('support.copy')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div class="bank-info-item">
              <span class="info-label">{{ $t('support.fibNumber') }}</span>
              <div class="info-value-wrapper">
                <span class="info-value">{{ $t('support.fibNumberValue') }}</span>
                <button @click="copyToClipboard($t('support.fibNumberValue'))" class="info-copy-btn" :title="$t('support.copy')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Actions -->
        <div class="payment-actions">
          <button @click="checkPaymentStatus" class="action-button secondary" :disabled="isCheckingStatus">
            <span v-if="isCheckingStatus" class="button-loading">
              <span class="spinner-small"></span>
            </span>
            <span v-else>{{ $t('support.checkStatus') }}</span>
          </button>
          <button @click="resetPayment" class="action-button secondary">
            {{ $t('support.createNew') }}
          </button>
          <button 
            v-if="isAdmin" 
            @click="cancelPayment" 
            class="action-button danger" 
            :disabled="isCancellingPayment || paymentStatus === 'paid' || paymentStatus === 'cancelled'"
          >
            <span v-if="isCancellingPayment" class="button-loading">
              <span class="spinner-small"></span>
            </span>
            <span v-else>{{ $t('support.cancelPayment') }}</span>
          </button>
        </div>
      </div>

      <!-- Bank Details Card (shown when no payment) -->
      <div v-else class="bank-info-card">
        <div class="card-header">
          <h2>{{ $t('support.donationDetails') }}</h2>
          <p class="card-subtitle">{{ $t('support.donationNote') }}</p>
        </div>
        <div class="bank-info-grid">
          <div class="bank-info-item">
            <span class="info-label">{{ $t('support.bank') }}</span>
            <div class="info-value-wrapper">
              <span class="info-value">{{ $t('support.bankName') }}</span>
              <button @click="copyToClipboard($t('support.bankName'))" class="info-copy-btn" :title="$t('support.copy')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="bank-info-item">
            <span class="info-label">{{ $t('support.accountName') }}</span>
            <div class="info-value-wrapper">
              <span class="info-value">{{ $t('support.accountNameValue') }}</span>
              <button @click="copyToClipboard($t('support.accountNameValue'))" class="info-copy-btn" :title="$t('support.copy')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="bank-info-item">
            <span class="info-label">{{ $t('support.fibNumber') }}</span>
            <div class="info-value-wrapper">
              <span class="info-value">{{ $t('support.fibNumberValue') }}</span>
              <button @click="copyToClipboard($t('support.fibNumberValue'))" class="info-copy-btn" :title="$t('support.copy')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Thank You Message -->
      <div class="thank-you-section">
        <p class="thank-you-text">{{ $t('support.thankYou') }}</p>
      </div>

      <!-- Payment History (Admin Only) -->
      <div v-if="isAdmin" class="payment-history-card">
        <div class="card-header">
          <h2>{{ $t('support.paymentHistory') }}</h2>
          <p class="card-subtitle">{{ $t('support.paymentHistoryDescription') }}</p>
          <!-- Debug info (remove in production) -->
          <small style="color: var(--muted); display: block; margin-top: 8px;">
            Debug: {{ paymentHistory.length }} payments loaded
          </small>
        </div>

        <!-- Loading State -->
        <div v-if="isLoadingHistory" class="history-loading">
          <span class="spinner-small"></span>
          <span>{{ $t('support.loadingHistory') }}</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="paymentHistory.length === 0" class="history-empty">
          <div class="empty-icon">📋</div>
          <p>{{ $t('support.noPaymentHistory') }}</p>
          <p style="font-size: 12px; color: var(--muted); margin-top: 8px;">
            Check browser console for errors
          </p>
        </div>

        <!-- Payment History Table -->
        <div v-else class="history-table-wrapper">
          <table class="payment-history-table">
            <thead>
              <tr>
                <th>{{ $t('support.historyPaymentId') }}</th>
                <th>{{ $t('support.historyAmount') }}</th>
                <th>{{ $t('support.historyStatus') }}</th>
                <th>{{ $t('support.historyCreated') }}</th>
                <th>{{ $t('support.historyPaid') }}</th>
                <th>{{ $t('support.historyActions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in paymentHistory" :key="payment.paymentId || payment.id" class="history-row">
                <td class="payment-id-cell">
                  <code class="payment-id-code">{{ payment.paymentId ? (payment.paymentId.length > 8 ? payment.paymentId.slice(0, 8) + '...' : payment.paymentId) : 'N/A' }}</code>
                  <button 
                    v-if="payment.paymentId"
                    @click="copyToClipboard(payment.paymentId)" 
                    class="copy-id-btn"
                    :title="$t('support.copyPaymentId')"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </td>
                <td class="amount-cell">
                  <span class="amount-value">{{ payment.amount ? formatAmount(payment.amount) : 'N/A' }}</span>
                  <span class="amount-currency">{{ payment.currency || 'N/A' }}</span>
                </td>
                <td class="status-cell">
                  <span class="status-badge" :class="getStatusBadgeClass(payment.status || 'pending')">
                    {{ getStatusText(payment.status || 'pending') }}
                  </span>
                </td>
                <td class="date-cell">{{ formatDate(payment.createdAt) }}</td>
                <td class="date-cell">
                  <span v-if="payment.paidAt">{{ formatDate(payment.paidAt) }}</span>
                  <span v-else class="date-empty">—</span>
                </td>
                <td class="actions-cell">
                  <div class="table-actions">
                    <button 
                      @click="viewPaymentDetails(payment)" 
                      class="action-btn view-btn"
                      :title="$t('support.viewDetails')"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                    <button 
                      v-if="payment.status === 'pending'"
                      @click="checkPaymentFromHistory(payment.paymentId)" 
                      class="action-btn check-btn"
                      :title="$t('support.checkStatus')"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </button>
                    <button 
                      v-if="payment.status === 'pending'"
                      @click="cancelPaymentFromHistory(payment.paymentId)" 
                      class="action-btn cancel-btn"
                      :title="$t('support.cancelPayment')"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Toast Notification -->
      <ToastNotification />
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted, watch } from 'vue'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import { fibService } from '@/services/fibService'
import { paymentService, type Payment } from '@/services/paymentService'
import { useLoadingState } from '../../composables/useLoadingState'
import { useToast } from '../../composables/useToast'
import ToastNotification from '../../components/ToastNotification.vue'
import { useAuthStore } from '@/stores/authStore'

const { isLoading, startLoading, stopLoading } = useLoadingState()
const { success, error: showError } = useToast()
const auth = useAuthStore()

const isPaymentLoading = computed(() => isLoading('payment'))
const isAdmin = computed(() => auth.user?.role === 'admin')

const paymentAmount = ref<number | null>(null)
const qrCode = ref('')
const readableCode = ref('')
const paymentId = ref('')
const paymentStatus = ref<'pending' | 'paid' | 'declined' | 'expired' | 'cancelled'>('pending')
const rawPaymentStatus = ref<string>('') // Store raw API status for debugging
const isCheckingStatus = ref(false)
const isCancellingPayment = ref(false)
const isLoadingHistory = ref(false)

const paymentHistory = ref<Payment[]>([])

// Load payment history from API
const loadPaymentHistory = async () => {
  if (!isAdmin.value) {
    console.log('Not an admin, skipping payment history load')
    return
  }
  
  try {
    isLoadingHistory.value = true
    console.log('Loading payment history...')
    const payments = await paymentService.getPayments()
    console.log('Loaded payments:', payments)
    
    // Filter out invalid payments and sort by created date (newest first)
    paymentHistory.value = payments
      .filter(p => p && (p.paymentId || p.id)) // Only include payments with valid IDs
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        // Handle invalid dates
        if (isNaN(dateA) && isNaN(dateB)) return 0
        if (isNaN(dateA)) return 1 // Invalid dates go to end
        if (isNaN(dateB)) return -1
        return dateB - dateA
      })
    console.log('Payment history loaded:', paymentHistory.value.length, 'payments')
  } catch (err: any) {
    console.error('Failed to load payment history:', err)
    console.error('Error details:', err.response?.data || err.message)
    paymentHistory.value = []
    showError('Failed to load payment history: ' + (err.response?.data?.message || err.message || 'Unknown error'))
  } finally {
    isLoadingHistory.value = false
  }
}

// Add or update payment in history
const updatePaymentHistory = async (payment: Omit<Payment, 'id'>) => {
  try {
    const existing = await paymentService.getPaymentByPaymentId(payment.paymentId)
    
    if (existing && existing.id) {
      // Update existing payment
      await paymentService.updatePayment(existing.id, payment)
    } else {
      // Create new payment
      await paymentService.createPayment({
        ...payment,
        userId: auth.user?.id
      })
    }
    
    // Reload payment history
    await loadPaymentHistory()
  } catch (err) {
    console.error('Failed to save payment history:', err)
    showError('Failed to save payment to history')
  }
}

// Format amount with thousand separators
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('en-US').format(amount)
}

// Format date
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) {
    return '—'
  }
  
  const date = new Date(dateString)
  
  // Check if date is valid
  if (isNaN(date.getTime()) || !isFinite(date.getTime())) {
    console.warn('Invalid date string:', dateString)
    return 'Invalid Date'
  }
  
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  } catch (err) {
    console.error('Error formatting date:', err, dateString)
    return 'Invalid Date'
  }
}

// Get status badge class
const getStatusBadgeClass = (status: string) => {
  return {
    'badge-pending': status === 'pending',
    'badge-paid': status === 'paid',
    'badge-declined': status === 'declined' || status === 'expired' || status === 'cancelled'
  }
}

// Get status text
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    declined: 'Declined',
    expired: 'Expired',
    cancelled: 'Cancelled'
  }
  return statusMap[status] || status
}

// View payment details
const viewPaymentDetails = (payment: Payment) => {
  // Set current payment details to view
  paymentId.value = payment.paymentId
  paymentAmount.value = payment.amount
  paymentStatus.value = payment.status
  readableCode.value = payment.readableCode || ''
  
  // Scroll to payment details section
  setTimeout(() => {
    const detailsCard = document.querySelector('.payment-details-card')
    if (detailsCard) {
      detailsCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, 100)
}

// Check payment status from history
const checkPaymentFromHistory = async (id: string) => {
  const originalPaymentId = paymentId.value
  paymentId.value = id
  
  await checkPaymentStatus()
  
  // Update history with new status
  if (paymentId.value && paymentStatus.value) {
    await paymentService.updatePaymentByPaymentId(paymentId.value, {
      status: paymentStatus.value,
      ...(paymentStatus.value === 'paid' ? { paidAt: new Date().toISOString() } : {})
    })
    await loadPaymentHistory()
  }
  
  paymentId.value = originalPaymentId
}

// Cancel payment from history
const cancelPaymentFromHistory = async (id: string) => {
  const originalPaymentId = paymentId.value
  paymentId.value = id
  
  await cancelPayment()
  
  // Update history with cancelled status
  if (paymentId.value) {
    await paymentService.updatePaymentByPaymentId(paymentId.value, {
      status: 'cancelled'
    })
    await loadPaymentHistory()
  }
  
  paymentId.value = originalPaymentId
}

// Periodic refresh for payment history (for admins)
let historyRefreshInterval: number | null = null

const startHistoryRefresh = () => {
  if (!isAdmin.value) return
  
  // Clear any existing interval
  if (historyRefreshInterval) {
    clearInterval(historyRefreshInterval)
  }
  
  // Refresh payment history every 15 seconds for admins
  historyRefreshInterval = window.setInterval(async () => {
    if (isAdmin.value && !isLoadingHistory.value) {
      try {
        await loadPaymentHistory()
      } catch (err) {
        console.error('Failed to refresh payment history:', err)
      }
    }
  }, 15000) // 15 seconds
}

const stopHistoryRefresh = () => {
  if (historyRefreshInterval) {
    clearInterval(historyRefreshInterval)
    historyRefreshInterval = null
  }
}

// Watch for admin status changes and load history
watch([isAdmin, () => auth.user], ([newIsAdmin]) => {
  if (newIsAdmin) {
    console.log('Admin status detected, loading payment history')
    loadPaymentHistory()
    // Start periodic refresh for admins
    startHistoryRefresh()
  } else {
    // Stop refresh if not admin
    stopHistoryRefresh()
  }
}, { immediate: true })

// Also try to load on mount
onMounted(() => {
  console.log('SupportView mounted, isAdmin:', isAdmin.value, 'user:', auth.user)
  if (isAdmin.value) {
    loadPaymentHistory()
    startHistoryRefresh()
  }
})

// Cleanup on unmount - consolidate all cleanup here
onUnmounted(() => {
  stopHistoryRefresh()
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval)
    statusPollingInterval = null
  }
})

const paymentDetails = computed(() => !!paymentId.value)

// Map API status to our internal status values
const normalizePaymentStatus = (apiStatus: string): 'pending' | 'paid' | 'declined' | 'expired' | 'cancelled' => {
  const statusLower = apiStatus.toLowerCase().trim()
  
  // Map various possible status values
  const statusMap: Record<string, 'pending' | 'paid' | 'declined' | 'expired' | 'cancelled'> = {
    'pending': 'pending',
    'active': 'pending',
    'created': 'pending',
    'waiting': 'pending',
    'paid': 'paid',
    'completed': 'paid',
    'success': 'paid',
    'successful': 'paid',
    'confirmed': 'paid',
    'declined': 'declined',
    'rejected': 'declined',
    'failed': 'declined',
    'expired': 'expired',
    'expire': 'expired',
    'timeout': 'expired',
    'cancelled': 'cancelled',
    'canceled': 'cancelled',
    'cancel': 'cancelled'
  }
  
  // Return mapped status or default to pending if unknown
  const normalized = statusMap[statusLower] || 'pending'
  
  // Log if we get an unknown status for debugging
  if (!statusMap[statusLower]) {
    console.warn(`Unknown payment status received: "${apiStatus}" (normalized to: ${normalized})`)
  }
  
  return normalized
}

const paymentStatusClass = computed(() => {
  return {
    'status-pending': paymentStatus.value === 'pending',
    'status-paid': paymentStatus.value === 'paid',
    'status-declined': paymentStatus.value === 'declined',
    'status-expired': paymentStatus.value === 'expired',
    'status-cancelled': paymentStatus.value === 'cancelled'
  }
})

const paymentStatusText = computed(() => {
  const statusMap = {
    pending: 'Pending',
    paid: 'Paid',
    declined: 'Declined',
    expired: 'Expired',
    cancelled: 'Cancelled'
  }
  return statusMap[paymentStatus.value] || 'Unknown'
})

const createPayment = async () => {
  if (!paymentAmount.value || paymentAmount.value <= 0) {
    showError('Please enter a valid amount')
    return
  }

  try {
    startLoading('payment', 'Creating payment...')
    
    // Authorize first
    await fibService.authorize()
    
    // Create payment
    const response = await fibService.createPayment({
      monetaryValue: {
        amount: paymentAmount.value.toString(),
        currency: 'IQD'
      },
      description: `Support CodeFix - ${paymentAmount.value} IQD`,
      redirectUri: window.location.origin,
      expiresIn: 'PT8H',
      category: 'ECOMMERCE',
      refundableFor: 'PT48H'
    })

    paymentId.value = response.paymentId
    qrCode.value = response.qrCode
    readableCode.value = response.readableCode
    paymentStatus.value = 'pending'

    // Save to payment history
    updatePaymentHistory({
      paymentId: response.paymentId,
      amount: paymentAmount.value,
      currency: 'IQD',
      status: 'pending',
      createdAt: new Date().toISOString(),
      description: `Support CodeFix - ${paymentAmount.value} IQD`,
      readableCode: response.readableCode
    })

    success('Payment created successfully! Scan the QR code or use the payment code.')
    
    // Start checking payment status periodically
    startPaymentStatusPolling()
  } catch (err: any) {
    console.error('Payment error:', err)
    let errorMessage = 'Failed to create payment. Please try again.'
    
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      errorMessage = 'Network error: Unable to connect to payment service. Please check your connection.'
    } else if (err.response) {
      errorMessage = `Payment error: ${err.response.data?.message || err.message}`
    } else if (err.message) {
      errorMessage = err.message
    }
    
    showError(errorMessage)
  } finally {
    stopLoading('payment')
  }
}

const checkPaymentStatus = async () => {
  if (!paymentId.value) return

  try {
    isCheckingStatus.value = true
    const response = await fibService.checkPayment(paymentId.value)
    
    // Store raw status for debugging
    rawPaymentStatus.value = response.status
    
    // Normalize the status from API
    const normalizedStatus = normalizePaymentStatus(response.status)
    paymentStatus.value = normalizedStatus
    
    // Log the status mapping for debugging
    console.log('Payment status check:', {
      raw: response.status,
      normalized: normalizedStatus,
      paymentId: paymentId.value
    })
    
    // Update payment history
    if (paymentId.value) {
      await paymentService.updatePaymentByPaymentId(paymentId.value, {
        status: normalizedStatus,
        ...(normalizedStatus === 'paid' ? { paidAt: new Date().toISOString() } : {})
      })
      await loadPaymentHistory()
    }
    
    // Show appropriate messages based on status
    if (normalizedStatus === 'paid') {
      success('Payment received! Thank you for your support! 🎉')
    } else if (normalizedStatus === 'declined') {
      showError('Payment was declined. Please try again.')
    } else if (normalizedStatus === 'expired') {
      showError('Payment has expired. Please create a new payment.')
    } else if (normalizedStatus === 'cancelled') {
      showError('Payment has been cancelled.')
    }
  } catch (err: any) {
    console.error('Status check error:', err)
    showError('Failed to check payment status. Please try again.')
  } finally {
    isCheckingStatus.value = false
  }
}

let statusPollingInterval: number | null = null

const startPaymentStatusPolling = () => {
  // Clear any existing interval
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval)
  }

  // Check status every 10 seconds
  statusPollingInterval = window.setInterval(async () => {
    if (!paymentId.value) {
      if (statusPollingInterval) {
        clearInterval(statusPollingInterval)
        statusPollingInterval = null
      }
      return
    }

    try {
      const response = await fibService.checkPayment(paymentId.value)
      
      // Store raw status
      rawPaymentStatus.value = response.status
      
      // Normalize the status
      const newStatus = normalizePaymentStatus(response.status)
      
      if (newStatus !== paymentStatus.value) {
        paymentStatus.value = newStatus
        
        // Update payment in database
        if (paymentId.value) {
          try {
            await paymentService.updatePaymentByPaymentId(paymentId.value, {
              status: newStatus,
              ...(newStatus === 'paid' ? { paidAt: new Date().toISOString() } : {})
            })
            // Reload payment history for admins
            if (isAdmin.value) {
              await loadPaymentHistory()
            }
          } catch (err) {
            console.error('Failed to update payment status in database:', err)
          }
        }
        
        if (newStatus === 'paid') {
          success('Payment received! Thank you for your support! 🎉')
          // Stop polling once paid
          if (statusPollingInterval) {
            clearInterval(statusPollingInterval)
            statusPollingInterval = null
          }
        } else if (newStatus === 'expired' || newStatus === 'declined' || newStatus === 'cancelled') {
          // Stop polling if expired, declined, or cancelled
          if (statusPollingInterval) {
            clearInterval(statusPollingInterval)
            statusPollingInterval = null
          }
        }
      }
    } catch (err) {
      // Silently fail - don't spam errors for polling
      console.error('Status polling error:', err)
    }
  }, 10000)
}

const cancelPayment = async () => {
  if (!paymentId.value || !isAdmin.value) {
    showError('Only administrators can cancel payments.')
    return
  }

  // Confirm cancellation
  if (!confirm('Are you sure you want to cancel this payment? This action cannot be undone.')) {
    return
  }

  try {
    isCancellingPayment.value = true
    await fibService.cancelPayment(paymentId.value)
    
    // Update status
    paymentStatus.value = 'cancelled'
    rawPaymentStatus.value = 'cancelled'
    
    // Update payment history
    if (paymentId.value) {
      await paymentService.updatePaymentByPaymentId(paymentId.value, {
        status: 'cancelled'
      })
      await loadPaymentHistory()
    }
    
    // Stop polling
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval)
      statusPollingInterval = null
    }
    
    success('Payment cancelled successfully.')
  } catch (err: any) {
    console.error('Cancel payment error:', err)
    let errorMessage = 'Failed to cancel payment. Please try again.'
    
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      errorMessage = 'Network error: Unable to connect to payment service.'
    } else if (err.response) {
      errorMessage = `Error: ${err.response.data?.message || err.message}`
    } else if (err.message) {
      errorMessage = err.message
    }
    
    showError(errorMessage)
  } finally {
    isCancellingPayment.value = false
  }
}

const resetPayment = () => {
  paymentId.value = ''
  qrCode.value = ''
  readableCode.value = ''
  paymentAmount.value = null
  paymentStatus.value = 'pending'
  rawPaymentStatus.value = ''
  
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval)
    statusPollingInterval = null
  }
}

const copyCode = async () => {
  if (!readableCode.value) return
  
  try {
    await navigator.clipboard.writeText(readableCode.value)
    success('Payment code copied to clipboard!')
  } catch (err) {
    showError('Failed to copy code. Please copy manually.')
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    success('Copied to clipboard!')
  } catch (err) {
    showError('Failed to copy. Please copy manually.')
  }
}

</script>

<style scoped>
.support-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* Hero Section */
.support-hero {
  text-align: center;
  margin-bottom: 40px;
}

.hero-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.support-title {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 16px;
  color: var(--text);
  background: linear-gradient(135deg, var(--brand), var(--brand-strong));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.support-description {
  font-size: 16px;
  color: var(--muted);
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

/* Card Styles */
.payment-card,
.payment-details-card,
.bank-info-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.card-header {
  margin-bottom: 24px;
}

.card-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--text);
}

.card-subtitle {
  color: var(--muted);
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

/* Payment Form */
.payment-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.input-wrapper {
  position: relative;
}

.amount-input {
  width: 100%;
  padding: 14px 16px;
  background: var(--bg);
  border: 2px solid var(--line);
  border-radius: 12px;
  color: var(--text);
  font-size: 16px;
  transition: all 0.2s;
}

.amount-input:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.amount-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.amount-input::placeholder {
  color: var(--muted);
}

/* Buttons */
.payment-button {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, var(--brand), var(--brand-strong));
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.payment-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

.payment-button:active:not(:disabled) {
  transform: translateY(0);
}

.payment-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.button-loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Payment Status */
.payment-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  margin-top: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.status-pending {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.status-pending .status-dot {
  background: #fbbf24;
}

.status-paid {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status-paid .status-dot {
  background: #10b981;
  animation: none;
}

.status-declined,
.status-expired,
.status-cancelled {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.status-declined .status-dot,
.status-expired .status-dot,
.status-cancelled .status-dot {
  background: #ef4444;
  animation: none;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* QR Code Section */
.qr-section {
  margin: 24px 0;
}

.qr-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.qr-code-wrapper {
  width: 240px;
  height: 240px;
  background: white;
  border: 2px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.qr-code-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-placeholder {
  width: 240px;
  height: 240px;
  background: var(--bg);
  border: 2px dashed var(--line);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--muted);
}

.qr-icon {
  font-size: 48px;
}

.readable-code-section {
  margin-top: 24px;
}

.code-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 8px;
}

.code-display {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg);
  border: 2px solid var(--line);
  border-radius: 12px;
  padding: 12px 16px;
}

.payment-code {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: 600;
  color: var(--brand);
  letter-spacing: 1px;
}

.copy-button {
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.copy-button:hover {
  color: var(--brand);
  background: rgba(59, 130, 246, 0.1);
}

/* Bank Details */
.bank-details {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid var(--line);
}

.bank-details-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
  color: var(--text);
}

.bank-info-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bank-info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 13px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-value {
  font-size: 16px;
  font-weight: 500;
  color: var(--text);
}

.info-copy-btn {
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0.6;
}

.info-copy-btn:hover {
  color: var(--brand);
  opacity: 1;
  background: rgba(59, 130, 246, 0.1);
}

/* Payment Actions */
.payment-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
}

.action-button {
  flex: 1;
  padding: 12px 20px;
  background: var(--bg);
  border: 2px solid var(--line);
  border-radius: 10px;
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-button:hover:not(:disabled) {
  border-color: var(--brand);
  color: var(--brand);
  background: rgba(59, 130, 246, 0.05);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-button.secondary {
  background: transparent;
}

.action-button.danger {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #ef4444;
}

.action-button.danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  border-color: #dc2626;
  color: #dc2626;
}

.action-button.danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Thank You Section */
.thank-you-section {
  text-align: center;
  margin-top: 40px;
  padding: 24px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 16px;
}

.thank-you-text {
  font-size: 16px;
  color: var(--muted);
  margin: 0;
  line-height: 1.6;
}

/* Payment History */
.payment-history-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 32px;
  margin-top: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.history-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: var(--muted);
}

.history-empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.history-table-wrapper {
  overflow-x: auto;
  margin-top: 20px;
  -webkit-overflow-scrolling: touch;
}

.payment-history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 800px;
}

.payment-history-table thead {
  background: var(--bg);
  border-bottom: 2px solid var(--line);
}

.payment-history-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: var(--text);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.payment-history-table tbody tr {
  border-bottom: 1px solid var(--line);
  transition: background 0.2s;
}

.payment-history-table tbody tr:hover {
  background: rgba(59, 130, 246, 0.05);
}

.payment-history-table td {
  padding: 16px;
  color: var(--text);
  vertical-align: middle;
}

.payment-id-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.payment-id-code {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: var(--brand);
  background: var(--bg);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--line);
}

.copy-id-btn {
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0.6;
}

.copy-id-btn:hover {
  color: var(--brand);
  opacity: 1;
  background: rgba(59, 130, 246, 0.1);
}

.amount-cell {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.amount-value {
  font-weight: 600;
  color: var(--text);
  font-size: 15px;
}

.amount-currency {
  font-size: 12px;
  color: var(--muted);
}

.status-cell {
  display: flex;
  align-items: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.badge-pending {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.badge-paid {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.badge-declined {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.date-cell {
  color: var(--muted);
  font-size: 13px;
}

.date-empty {
  color: var(--muted);
  opacity: 0.5;
}

.actions-cell {
  width: 120px;
}

.table-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--muted);
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: var(--brand);
  color: var(--brand);
  background: rgba(59, 130, 246, 0.1);
}

.action-btn.view-btn:hover {
  border-color: var(--brand);
  color: var(--brand);
}

.action-btn.check-btn:hover {
  border-color: #10b981;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.action-btn.cancel-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Responsive */
@media (max-width: 640px) {
  .support-container {
    padding: 24px 16px;
  }

  .support-title {
    font-size: 28px;
  }

  .payment-card,
  .payment-details-card,
  .bank-info-card,
  .payment-history-card {
    padding: 24px 20px;
  }

  .qr-code-wrapper,
  .qr-placeholder {
    width: 200px;
    height: 200px;
  }

  .payment-actions {
    flex-direction: column;
  }

  .payment-history-table {
    font-size: 12px;
  }

  .payment-history-table th,
  .payment-history-table td {
    padding: 10px 8px;
  }

  .payment-history-table th:nth-child(4),
  .payment-history-table th:nth-child(5),
  .payment-history-table td:nth-child(4),
  .payment-history-table td:nth-child(5) {
    display: none;
  }
}
</style>
