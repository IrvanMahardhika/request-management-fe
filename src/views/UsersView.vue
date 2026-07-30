<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/lib/api'
import type { PublicUser } from '@/types'

const items = ref<PublicUser[]>([])
const error = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const data = await api<{ items: PublicUser[] }>('/users')
    items.value = data.items
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load users'
  } finally {
    loading.value = false
  }
}

async function deactivate(id: string) {
  error.value = ''
  try {
    await api(`/users/${id}/deactivate`, { method: 'PATCH', json: {} })
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Deactivate failed'
  }
}

onMounted(load)
</script>

<template>
  <div class="stack">
    <header class="header">
      <div>
        <h1>Users</h1>
        <p class="muted">Platform administration of accounts, roles, and scope</p>
      </div>
      <RouterLink class="btn" to="/users/new">Create user</RouterLink>
    </header>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted">Loading…</p>
    <div v-else class="panel table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Scope</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in items" :key="u.id">
            <td>
              <strong>{{ u.fullName }}</strong>
              <div class="muted">{{ u.email }}</div>
            </td>
            <td>{{ u.role.name }}</td>
            <td>
              {{ u.scopeType }}
              <div class="muted">
                {{ u.site?.name || u.territory?.name || u.country?.name || 'Platform' }}
              </div>
            </td>
            <td>{{ u.status }}</td>
            <td>
              <button
                v-if="u.status === 'active'"
                class="btn secondary"
                type="button"
                @click="deactivate(u.id)"
              >
                Deactivate
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}
.table-wrap {
  padding: 0.5rem 1rem 1rem;
  overflow-x: auto;
}
</style>
