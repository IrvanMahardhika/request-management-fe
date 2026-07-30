<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/lib/api'
import type { OperationalRequest } from '@/types'

const props = defineProps<{ level: 'platform' | 'country' | 'territory' | 'site' }>()

const loading = ref(true)
const error = ref('')
const total = ref(0)
const byStatus = ref<Record<string, number>>({})
const byPriority = ref<Record<string, number>>({})
const items = ref<OperationalRequest[]>([])

onMounted(async () => {
  try {
    const data = await api<{
      total: number
      byStatus: Record<string, number>
      byPriority: Record<string, number>
      items: OperationalRequest[]
    }>(`/reports/${props.level}`)
    total.value = data.total
    byStatus.value = data.byStatus
    byPriority.value = data.byPriority
    items.value = data.items
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load report'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="stack">
    <h1>{{ level }} reporting</h1>
    <p class="muted">Scoped operational request summary for your role</p>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted">Loading…</p>
    <template v-else>
      <div class="stats">
        <div class="panel stat">
          <p class="muted">Total</p>
          <strong>{{ total }}</strong>
        </div>
        <div class="panel stat">
          <p class="muted">By priority</p>
          <ul>
            <li v-for="(n, key) in byPriority" :key="key">{{ key }}: {{ n }}</li>
          </ul>
        </div>
        <div class="panel stat">
          <p class="muted">By status</p>
          <ul>
            <li v-for="(n, key) in byStatus" :key="key">{{ key }}: {{ n }}</li>
          </ul>
        </div>
      </div>
      <div class="panel table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Age</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>
                <RouterLink :to="`/requests/${item.id}`">{{ item.title }}</RouterLink>
              </td>
              <td>{{ item.status }}</td>
              <td>{{ item.priority }}</td>
              <td>{{ item.ageInDays }}d</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.8rem;
}
.stat {
  padding: 1rem;
}
.stat strong {
  font-family: var(--font-display);
  font-size: 2rem;
}
.stat ul {
  margin: 0.4rem 0 0;
  padding-left: 1rem;
}
.table-wrap {
  padding: 0.5rem 1rem 1rem;
  overflow-x: auto;
}
</style>
