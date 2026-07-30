<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/lib/api'

const router = useRouter()
const roles = ref<{ code: string; name: string; organizationScope: string }[]>([])
const countries = ref<{ id: string; name: string }[]>([])
const territories = ref<{ id: string; name: string }[]>([])
const sites = ref<{ id: string; name: string }[]>([])
const error = ref('')
const loading = ref(false)

const form = reactive({
  email: '',
  fullName: '',
  password: 'Password123!',
  roleCode: 'staff_member',
  scopeType: 'site',
  countryId: '',
  territoryId: '',
  siteId: '',
})

async function loadBase() {
  const [r, c] = await Promise.all([
    api<{ items: typeof roles.value }>('/org/roles'),
    api<{ items: typeof countries.value }>('/org/countries'),
  ])
  roles.value = r.items
  countries.value = c.items
  syncScopeFromRole()
}

function syncScopeFromRole() {
  const role = roles.value.find((x) => x.code === form.roleCode)
  if (role) form.scopeType = role.organizationScope
}

watch(
  () => form.roleCode,
  () => {
    syncScopeFromRole()
    form.countryId = ''
    form.territoryId = ''
    form.siteId = ''
    territories.value = []
    sites.value = []
  },
)

watch(
  () => form.countryId,
  async (id) => {
    form.territoryId = ''
    form.siteId = ''
    sites.value = []
    if (!id) {
      territories.value = []
      return
    }
    const data = await api<{ items: typeof territories.value }>(`/org/countries/${id}/territories`)
    territories.value = data.items
  },
)

watch(
  () => form.territoryId,
  async (id) => {
    form.siteId = ''
    if (!id) {
      sites.value = []
      return
    }
    const data = await api<{ items: typeof sites.value }>(`/org/territories/${id}/sites`)
    sites.value = data.items
  },
)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await api('/users', {
      method: 'POST',
      json: {
        email: form.email,
        fullName: form.fullName,
        password: form.password,
        roleCode: form.roleCode,
        scopeType: form.scopeType,
        countryId: form.countryId || null,
        territoryId: form.territoryId || null,
        siteId: form.siteId || null,
      },
    })
    await router.push('/users')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Create failed'
  } finally {
    loading.value = false
  }
}

onMounted(loadBase)
</script>

<template>
  <div class="stack narrow">
    <h1>Create user</h1>
    <form class="panel form" @submit.prevent="submit">
      <label class="field">
        <span>Full name</span>
        <input v-model="form.fullName" required />
      </label>
      <label class="field">
        <span>Email</span>
        <input v-model="form.email" type="email" required />
      </label>
      <label class="field">
        <span>Password</span>
        <input v-model="form.password" type="password" required />
      </label>
      <label class="field">
        <span>Role</span>
        <select v-model="form.roleCode">
          <option v-for="r in roles" :key="r.code" :value="r.code">{{ r.name }}</option>
        </select>
      </label>
      <p class="muted">Organization scope: {{ form.scopeType }}</p>
      <label v-if="form.scopeType !== 'platform'" class="field">
        <span>Country</span>
        <select v-model="form.countryId" :required="form.scopeType !== 'platform'">
          <option value="">Select</option>
          <option v-for="c in countries" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </label>
      <label
        v-if="form.scopeType === 'territory' || form.scopeType === 'site'"
        class="field"
      >
        <span>Territory</span>
        <select v-model="form.territoryId" required>
          <option value="">Select</option>
          <option v-for="t in territories" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </label>
      <label v-if="form.scopeType === 'site'" class="field">
        <span>Site</span>
        <select v-model="form.siteId" required>
          <option value="">Select</option>
          <option v-for="s in sites" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn" type="submit" :disabled="loading">
        {{ loading ? 'Creating…' : 'Create user' }}
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
