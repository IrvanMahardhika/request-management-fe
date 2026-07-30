<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/lib/api'
import type { PublicUser } from '@/types'

const router = useRouter()
const staff = ref<PublicUser[]>([])
const requestingUserId = ref('')
const type = ref('equipment')
const title = ref('')
const description = ref('')
const error = ref('')
const loading = ref(false)

onMounted(async () => {
  try {
    const data = await api<{ items: PublicUser[] }>('/org/site-staff')
    staff.value = data.items
    if (staff.value[0]) requestingUserId.value = staff.value[0].id
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load staff'
  }
})

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const data = await api<{ request: { id: string } }>('/requests/on-behalf', {
      method: 'POST',
      json: {
        type: type.value,
        title: title.value,
        description: description.value,
        requestingUserId: requestingUserId.value,
      },
    })
    await router.push(`/requests/${data.request.id}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="stack narrow">
    <h1>Submit on behalf of staff</h1>
    <p class="muted">Creates a standard-priority request for a staff member on your site.</p>
    <form class="panel form" @submit.prevent="submit">
      <label class="field">
        <span>Staff member</span>
        <select v-model="requestingUserId" required>
          <option disabled value="">Select staff</option>
          <option v-for="u in staff" :key="u.id" :value="u.id">
            {{ u.fullName }} ({{ u.email }})
          </option>
        </select>
      </label>
      <label class="field">
        <span>Type</span>
        <input v-model="type" required />
      </label>
      <label class="field">
        <span>Title</span>
        <input v-model="title" required />
      </label>
      <label class="field">
        <span>Description</span>
        <textarea v-model="description" required />
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn" type="submit" :disabled="loading || !requestingUserId">
        {{ loading ? 'Submitting…' : 'Submit' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.narrow {
  max-width: 640px;
}
.form {
  padding: 1.2rem;
}
</style>
