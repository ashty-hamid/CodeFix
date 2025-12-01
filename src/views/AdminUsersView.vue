<template>
  <DefaultLayout>
    <section class="cf-container" style="padding-block: 32px">
      <!-- Access Denied (Not Admin) -->
      <div v-if="!isAdmin" class="error-container">
        <h2>{{ $t('adminUsers.accessDenied') }}</h2>
        <p>{{ $t('adminUsers.adminOnly') }}</p>
        <RouterLink to="/home">
          <button class="cf-btn cf-btn-primary">{{ $t('common.backToHome') }}</button>
        </RouterLink>
      </div>

      <!-- Admin Users Page -->
      <template v-else>
        <header style="margin-bottom: 24px">
          <h1 style="margin: 0 0 8px">{{ $t('adminUsers.title') }}</h1>
          <p style="color: var(--muted); margin: 0">
            {{ $t('adminUsers.description') }}
          </p>
        </header>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-container">
          <p>{{ $t('common.loading') }}...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-container">
          <p>{{ error }}</p>
          <button class="cf-btn cf-btn-primary" @click="fetchUsers">
            {{ $t('common.retry') }}
          </button>
        </div>

        <!-- Users List -->
        <div v-else>
          <!-- Search/Filter Card -->
          <div class="filters-card">
            <div class="filters-row">
              <input
                v-model="searchQuery"
                class="cf-search"
                type="text"
                :placeholder="$t('adminUsers.searchPlaceholder')"
              />
              <select v-model="roleFilter" class="cf-search">
                <option value="">{{ $t('adminUsers.allRoles') }}</option>
                <option value="admin">{{ $t('adminUsers.admin') }}</option>
                <option value="user">{{ $t('adminUsers.user') }}</option>
              </select>
              <select v-model="statusFilter" class="cf-search">
                <option value="">{{ $t('adminUsers.allStatuses') }}</option>
                <option value="active">{{ $t('adminUsers.active') }}</option>
                <option value="blocked">{{ $t('adminUsers.blocked') }}</option>
              </select>
            </div>
            <div class="users-count">
              {{ $t('adminUsers.totalUsers', { count: filteredUsers.length }) }}
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredUsers.length === 0" class="empty-box">
            <p class="empty-title">{{ $t('adminUsers.noUsersFound') }}</p>
          </div>

          <!-- Users Grid -->
          <div v-else class="users-grid">
            <article v-for="user in filteredUsers" :key="user.id" class="user-card">
              <!-- User Header -->
              <header class="user-card-header">
                <div class="user-info">
                  <div class="user-avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
                  <div>
                    <h3 class="user-name">
                      <RouterLink :to="`/user/${user.id}`" class="cf-link">
                        {{ user.username }}
                      </RouterLink>
                    </h3>
                    <p class="user-email">{{ user.email }}</p>
                  </div>
                </div>
                <div class="user-badges">
                  <span :class="['role-badge', user.role === 'admin' ? 'role-admin' : 'role-user']">
                    {{ user.role }}
                  </span>
                  <span v-if="user.blocked" class="status-badge status-blocked">
                    {{ $t('adminUsers.blocked') }}
                  </span>
                  <span v-else class="status-badge status-active">
                    {{ $t('adminUsers.active') }}
                  </span>
                </div>
              </header>

              <!-- User Meta -->
              <div class="user-meta">
                <div class="meta-item">
                  <span class="meta-label">{{ $t('adminUsers.id') }}:</span>
                  <span class="meta-value">#{{ user.id }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">{{ $t('adminUsers.createdAt') }}:</span>
                  <span class="meta-value">{{ formatDate(user.createdAt) }}</span>
                </div>
              </div>

              <!-- User Actions -->
              <footer class="user-actions" v-if="user.role !== 'admin'">
                <RouterLink :to="`/user/${user.id}`" class="cf-link action-link">
                  {{ $t('adminUsers.view') }}
                </RouterLink>
                <button
                  v-if="!user.blocked"
                  class="cf-btn cf-btn-warning"
                  @click="handleBlockUser(user)"
                  :disabled="isLoadingAction"
                >
                  {{ $t('admin.blockUser') }}
                </button>
                <button
                  v-else
                  class="cf-btn cf-btn-success"
                  @click="handleUnblockUser(user)"
                  :disabled="isLoadingAction"
                >
                  {{ $t('admin.unblockUser') }}
                </button>
                <button
                  class="cf-btn cf-btn-danger"
                  @click="handleDeleteUser(user)"
                  :disabled="isLoadingAction"
                >
                  {{ $t('admin.deleteUser') }}
                </button>
              </footer>
            </article>
          </div>
        </div>
      </template>

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteConfirm && userToDelete" class="modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="modal-content">
          <h3>{{ $t('admin.confirmDeleteUser') }}</h3>
          <p class="warning-text">
            {{ $t('admin.deleteUserWarning', { username: userToDelete.username }) }}
          </p>
          <div class="modal-actions">
            <button class="cf-btn cf-btn-secondary" @click="showDeleteConfirm = false">
              {{ $t('common.cancel') }}
            </button>
            <button class="cf-btn cf-btn-danger" @click="confirmDeleteUser" :disabled="isLoadingAction">
              {{ isLoadingAction ? '...' : $t('common.delete') }}
            </button>
          </div>
        </div>
      </div>

      <ToastNotification />
    </section>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import ToastNotification from '../../components/ToastNotification.vue'
import { useAuthStore } from '@/stores/authStore'
import { userService } from '@/services/userService'
import { useToast } from '../../composables/useToast'
import type { User } from '@/types/api.types'

const auth = useAuthStore()
const router = useRouter()
const { t } = useI18n()
const { success, error: showError } = useToast()

const users = ref<User[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const isLoadingAction = ref(false)
const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const showDeleteConfirm = ref(false)
const userToDelete = ref<User | null>(null)

const isAdmin = computed(() => auth.user?.role === 'admin')

// Filter users based on search query, role, and status
const filteredUsers = computed(() => {
  let filtered = users.value

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    )
  }

  // Role filter
  if (roleFilter.value) {
    filtered = filtered.filter((user) => user.role === roleFilter.value)
  }

  // Status filter
  if (statusFilter.value === 'blocked') {
    filtered = filtered.filter((user) => user.blocked === true)
  } else if (statusFilter.value === 'active') {
    filtered = filtered.filter((user) => !user.blocked)
  }

  return filtered
})

// Fetch all users
async function fetchUsers() {
  if (!isAdmin.value) return

  isLoading.value = true
  error.value = null
  try {
    users.value = await userService.getUsers()
  } catch (e: any) {
    error.value = e.response?.data?.message || e.message || t('adminUsers.fetchError')
    showError(t('adminUsers.fetchError'))
  } finally {
    isLoading.value = false
  }
}

// Block user
async function handleBlockUser(user: User) {
  if (!isAdmin.value) return

  isLoadingAction.value = true
  try {
    const updatedUser = await userService.blockUser(user.id)
    const index = users.value.findIndex((u) => u.id === user.id)
    if (index !== -1) {
      users.value[index] = updatedUser
    }
    success(t('admin.userBlocked', { username: updatedUser.username }))
  } catch (e: any) {
    showError(e.response?.data?.message || e.message || t('adminUsers.blockError'))
  } finally {
    isLoadingAction.value = false
  }
}

// Unblock user
async function handleUnblockUser(user: User) {
  if (!isAdmin.value) return

  isLoadingAction.value = true
  try {
    const updatedUser = await userService.unblockUser(user.id)
    const index = users.value.findIndex((u) => u.id === user.id)
    if (index !== -1) {
      users.value[index] = updatedUser
    }
    success(t('admin.userUnblocked', { username: updatedUser.username }))
  } catch (e: any) {
    showError(e.response?.data?.message || e.message || t('adminUsers.unblockError'))
  } finally {
    isLoadingAction.value = false
  }
}

// Delete user
function handleDeleteUser(user: User) {
  userToDelete.value = user
  showDeleteConfirm.value = true
}

async function confirmDeleteUser() {
  if (!userToDelete.value || !isAdmin.value) return

  isLoadingAction.value = true
  try {
    await userService.deleteUser(userToDelete.value.id)
    users.value = users.value.filter((u) => u.id !== userToDelete.value!.id)
    success(t('admin.userDeleted', { username: userToDelete.value.username }))
    showDeleteConfirm.value = false
    userToDelete.value = null
  } catch (e: any) {
    showError(e.response?.data?.message || e.message || t('adminUsers.deleteError'))
  } finally {
    isLoadingAction.value = false
  }
}

// Format date
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

// Watch for admin status changes
watch(() => auth.user?.role, (newRole) => {
  if (newRole === 'admin') {
    fetchUsers()
  } else {
    router.push('/home')
  }
})

// Fetch users on mount if admin
onMounted(() => {
  if (isAdmin.value) {
    fetchUsers()
  }
})
</script>

<style scoped>
.loading-container,
.error-container {
  text-align: center;
  padding: 40px 20px;
}

.error-container {
  background: rgba(255, 77, 77, 0.1);
  border: 1px solid rgb(255, 77, 77);
  border-radius: 8px;
  color: rgb(255, 120, 120);
}

.error-container p {
  color: var(--muted);
  margin-bottom: 20px;
}

/* Filters Card */
.filters-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 22px;
  margin-bottom: 26px;
}

.filters-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.filters-row .cf-search {
  flex: 1;
  min-width: 200px;
}

.users-count {
  color: var(--muted);
  font-size: 14px;
}

/* Empty State */
.empty-box {
  text-align: center;
  padding: 60px 20px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  color: var(--muted);
  margin: 0;
}

/* Users Grid */
.users-grid {
  display: grid;
  gap: 20px;
}

/* User Card */
.user-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 22px;
  transition: border-color 0.2s;
}

.user-card:hover {
  border-color: var(--brand);
}

.user-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
  flex-wrap: wrap;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.user-avatar {
  width: 48px;
  height: 48px;
  background: var(--brand);
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}

.user-name {
  margin: 0 0 4px;
  font-size: 18px;
}

.user-email {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.user-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.role-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.role-admin {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.role-user {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-blocked {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.user-meta {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.meta-label {
  color: var(--muted);
  font-size: 14px;
}

.meta-value {
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
}

.user-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.action-link {
  margin-right: auto;
}

/* Button Variants */
.cf-btn-warning {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.cf-btn-warning:hover:not(:disabled) {
  background: #d97706;
}

.cf-btn-success {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.cf-btn-success:hover:not(:disabled) {
  background: #059669;
}

.cf-btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.cf-btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.cf-btn-danger:disabled,
.cf-btn-warning:disabled,
.cf-btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cf-btn-secondary {
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--line);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.cf-btn-secondary:hover {
  background: var(--panel);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
}

.modal-content h3 {
  margin: 0 0 16px;
  color: var(--text);
  font-size: 20px;
}

.warning-text {
  color: var(--muted);
  margin: 0 0 24px;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
  }

  .filters-row .cf-search {
    width: 100%;
  }

  .user-card-header {
    flex-direction: column;
  }

  .user-badges {
    width: 100%;
  }

  .user-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .action-link {
    margin-right: 0;
    text-align: center;
    padding: 8px;
    background: var(--bg);
    border-radius: 8px;
  }

  .user-meta {
    flex-direction: column;
    gap: 12px;
  }
}
</style>

