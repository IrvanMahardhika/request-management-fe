<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { api } from '@/lib/api'
import type { OperationalRequest } from '@/types'

const loading = ref(true)
const error = ref('')
const total = ref(0)
const items = ref<OperationalRequest[]>([])
const filters = reactive({
  status: '',
  priority: '',
  countryId: '',
  territoryId: '',
  siteId: '',
})

const countries = ref<{ id: string; name: string }[]>([])
const territories = ref<{ id: string; name: string }[]>([])
const sites = ref<{ id: string; name: string; territoryId: string }[]>([])

const statuses = [
  'submitted',
  'under_review',
  'additional_info_requested',
  'additional_info_provided',
  'escalated_to_territory_manager',
  'escalated_to_country_ops_manager',
  'approved',
  'declined',
  'resolved',
]

async function loadOrg() {
  const [c, s] = await Promise.all([
    api<{ items: { id: string; name: string }[] }>('/org/countries'),
    api<{ items: { id: string; name: string; territoryId: string }[] }>('/org/sites'),
  ])
  countries.value = c.items
  sites.value = s.items
}

async function onCountryChange() {
  filters.territoryId = ''
  filters.siteId = ''
  territories.value = []
  if (!filters.countryId) return
  const data = await api<{ items: { id: string; name: string }[] }>(
    `/org/countries/${filters.countryId}/territories`,
  )
  territories.value = data.items
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.countryId) params.set('countryId', filters.countryId)
    if (filters.territoryId) params.set('territoryId', filters.territoryId)
    if (filters.siteId) params.set('siteId', filters.siteId)
    const qs = params.toString()
    const data = await api<{ total: number; items: OperationalRequest[] }>(
      `/requests${qs ? `?${qs}` : ''}`,
    )
    total.value = data.total
    items.value = data.items
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    await loadOrg()
  } catch {
    /* ignore org load for restricted roles */
  }
  await load()
})
</script>

<template>
  <div class="stack">
    <header class="header">
      <div>
        <h1>Dashboard</h1>
        <p class="muted">Operational requests in your organization scope</p>
      </div>
      <p class="total panel">Total <strong>{{ total }}</strong></p>
    </header>

    <section class="filters panel">
      <label class="field">
        <span>Status</span>
        <select v-model="filters.status">
          <option value="">All</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
      <label class="field">
        <span>Priority</span>
        <select v-model="filters.priority">
          <option value="">All</option>
          <option value="standard">standard</option>
          <option value="high">high</option>
        </select>
      </label>
      <label class="field">
        <span>Country</span>
        <select v-model="filters.countryId" @change="onCountryChange">
          <option value="">All</option>
          <option v-for="c in countries" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </label>
      <label class="field">
        <span>Territory</span>
        <select v-model="filters.territoryId">
          <option value="">All</option>
          <option v-for="t in territories" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </label>
      <label class="field">
        <span>Site</span>
        <select v-model="filters.siteId">
          <option value="">All</option>
          <option v-for="s in sites" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </label>
      <button class="btn" type="button" @click="load">Apply filters</button>
    </section>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted">Loading…</p>

    <div v-else class="panel table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Site</th>
            <th>Requester</th>
            <th>Age (days)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <RouterLink :to="`/requests/${item.id}`">{{ item.title }}</RouterLink>
              <div class="muted small">{{ item.type }}</div>
            </td>
            <td>{{ item.status }}</td>
            <td>
              <span class="badge" :class="item.priority">{{ item.priority }}</span>
            </td>
            <td>{{ item.site?.name }}</td>
            <td>{{ item.requestingUser?.fullName }}</td>
            <td>{{ item.ageInDays }}</td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="6" class="muted">No requests match the current filters.</td>
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

.total {
  padding: 0.8rem 1rem;
  min-width: 7rem;
  text-align: center;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  align-items: end;
}

.filters .field {
  margin: 0;
}

.table-wrap {
  padding: 0.5rem 1rem 1rem;
  overflow-x: auto;
}

.small {
  font-size: 0.8rem;
}
</style>
