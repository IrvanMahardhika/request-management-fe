<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/lib/api'

const router = useRouter()
const type = ref('equipment')
const title = ref('')
const description = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const data = await api<{ request: { id: string } }>('/requests', {
      method: 'POST',
      json: { type: type.value, title: title.value, description: description.value },
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
    <h1>Submit request</h1>
    <p class="muted">Creates a standard-priority request for your site as you.</p>
    <form class="panel form" @submit.prevent="submit">
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
      <button class="btn" type="submit" :disabled="loading">
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
