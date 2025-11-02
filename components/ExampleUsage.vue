<template>
  <div class="example-page">
    <h1>Loading & Error UI Pattern Example</h1>

    <!-- Loading Spinner Example -->
    <section class="section">
      <h2>Loading Spinner</h2>
      <div class="demo-box">
        <LoadingSpinner
          v-if="isLoading('data')"
          size="medium"
          :message="getLoadingMessage('data')"
        />
        <div v-else>
          <p>Content loaded successfully!</p>
        </div>
        <button @click="simulateLoading" class="btn">
          Simulate Loading
        </button>
      </div>
    </section>

    <!-- Toast Notifications Example -->
    <section class="section">
      <h2>Toast Notifications</h2>
      <div class="demo-box">
        <div class="button-group">
          <button @click="showSuccessToast" class="btn btn-success">
            Show Success
          </button>
          <button @click="showErrorToast" class="btn btn-error">
            Show Error
          </button>
          <button @click="showWarningToast" class="btn btn-warning">
            Show Warning
          </button>
          <button @click="showInfoToast" class="btn btn-info">
            Show Info
          </button>
        </div>
      </div>
    </section>

    <!-- Error State Example -->
    <section class="section">
      <h2>Error State</h2>
      <div class="demo-box">
        <div v-if="hasError('api')" class="error-box">
          <h3>Error</h3>
          <p>{{ getError('api')?.message }}</p>
          <button @click="removeError('api')" class="btn">
            Clear Error
          </button>
        </div>
        <button v-else @click="simulateError" class="btn btn-error">
          Simulate Error
        </button>
      </div>
    </section>

    <!-- Combined Example (Real API Call) -->
    <section class="section">
      <h2>Combined Example - API Call</h2>
      <div class="demo-box">
        <LoadingSpinner
          v-if="isLoading('api-call')"
          message="Fetching data from API..."
        />
        <div v-else-if="hasError('api-call')" class="error-box">
          <p>{{ getError('api-call')?.message }}</p>
        </div>
        <div v-else>
          <p>{{ apiData }}</p>
        </div>
        <button @click="makeApiCall" class="btn">
          Make API Call
        </button>
      </div>
    </section>

    <ToastNotification />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLoadingState } from '../composables/useLoadingState'
import { useErrorState } from '../composables/useErrorState'
import { useToast } from '../composables/useToast'
import LoadingSpinner from './LoadingSpinner.vue'
import ToastNotification from './ToastNotification.vue'

const { isLoading, startLoading, stopLoading, getLoadingMessage } = useLoadingState()
const { addError, removeError, getError, hasError } = useErrorState()
const { success, error, warning, info } = useToast()

const apiData = ref('No data yet')

// Simulate loading
const simulateLoading = () => {
  startLoading('data', 'Loading data...')
  setTimeout(() => {
    stopLoading('data')
    success('Data loaded successfully!')
  }, 2000)
}

// Simulate error
const simulateError = () => {
  addError('api', 'Failed to connect to the server. Please try again.', 'error', 500)
  error('An error occurred!')
}

// Toast examples
const showSuccessToast = () => {
  success('Operation completed successfully!')
}

const showErrorToast = () => {
  error('Something went wrong!')
}

const showWarningToast = () => {
  warning('This is a warning message!')
}

const showInfoToast = () => {
  info('Here is some information for you.')
}

// Combined example - Real API call pattern
const makeApiCall = async () => {
  startLoading('api-call', 'Fetching data...')
  removeError('api-call')

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Simulate random success/failure
    if (Math.random() > 0.5) {
      apiData.value = 'API call successful! Data received.'
      success('Data fetched successfully!')
    } else {
      throw new Error('API request failed')
    }
  } catch (err) {
    addError('api-call', 'Failed to fetch data. Please try again.', 'error')
    error('Failed to fetch data!')
  } finally {
    stopLoading('api-call')
  }
}
</script>

<style scoped>
.example-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

h1 {
  font-size: 32px;
  margin-bottom: 40px;
  color: #111827;
}

.section {
  margin-bottom: 40px;
}

h2 {
  font-size: 24px;
  margin-bottom: 20px;
  color: #374151;
}

.demo-box {
  padding: 30px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: #3b82f6;
  color: white;
}

.btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-success {
  background: #10b981;
}

.btn-success:hover {
  background: #059669;
}

.btn-error {
  background: #ef4444;
}

.btn-error:hover {
  background: #dc2626;
}

.btn-warning {
  background: #f59e0b;
}

.btn-warning:hover {
  background: #d97706;
}

.btn-info {
  background: #3b82f6;
}

.btn-info:hover {
  background: #2563eb;
}

.error-box {
  padding: 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #991b1b;
  text-align: center;
}

.error-box h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.error-box p {
  margin: 0 0 16px 0;
}
</style>
