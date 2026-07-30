<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/lib/api'
import { useAuth } from '@/composables/useAuth'
import type { OperationalRequest } from '@/types'

const route = useRoute()
const { state, can } = useAuth()
const request = ref<OperationalRequest | null>(null)
const audit = ref<
  {
    id: string
    action: string
    actingUserDisplayName: string
    previousStatus: string | null
    newStatus: string | null
    note: string | null
    createdAt: string
  }[]
>([])
const infoMessages = ref<
  { id: string; messageType: string; body: string; authorName?: string; createdAt: string }[]
>([])
const error = ref('')
const busy = ref(false)
const question = ref('')
const responseText = ref('')
const declineReason = ref('')
const resolutionNote = ref('')

const id = computed(() => route.params.id as string)

async function load() {
  error.value = ''
  try {
    const data = await api<{ request: OperationalRequest }>(`/requests/${id.value}`)
    request.value = data.request
    if (can('view_request_history')) {
      const hist = await api<{
        audit: typeof audit.value
        infoMessages: typeof infoMessages.value
      }>(`/requests/${id.value}/history`)
      audit.value = hist.audit
      infoMessages.value = hist.infoMessages
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load request'
  }
}

async function run(action: () => Promise<void>) {
  busy.value = true
  error.value = ''
  try {
    await action()
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Action failed'
  } finally {
    busy.value = false
  }
}

const canStartReview = computed(() => {
  const r = request.value
  if (!r) return false
  const viewPerm =
    r.priority === 'high' ? 'view_high_priority_request' : 'view_standard_priority_request'
  if (!can(viewPerm)) return false
  if (r.status === 'escalated_to_territory_manager') {
    return state.user?.role.code === 'territory_manager'
  }
  if (r.status === 'escalated_to_country_ops_manager') {
    return state.user?.role.code === 'country_ops_manager'
  }
  return ['submitted', 'additional_info_provided'].includes(r.status)
})

const canApprove = computed(() => {
  const r = request.value
  if (!r || r.status !== 'under_review') return false
  if (r.requestingUserId === state.user?.id) return false
  return can(
    r.priority === 'high'
      ? 'approve_high_priority_request'
      : 'approve_standard_priority_request',
  )
})

const canDecline = computed(() => {
  const r = request.value
  if (!r || r.status !== 'under_review') return false
  if (r.requestingUserId === state.user?.id) return false
  return can(
    r.priority === 'high'
      ? 'decline_high_priority_request'
      : 'decline_standard_priority_request',
  )
})

const canRequestInfo = computed(() => {
  const r = request.value
  if (!r || r.status !== 'under_review') return false
  return can(
    r.priority === 'high'
      ? 'request_info_on_high_priority_request'
      : 'request_info_on_standard_priority_request',
  )
})

const canProvideInfo = computed(() => {
  const r = request.value
  if (!r || r.status !== 'additional_info_requested') return false
  return (
    r.requestingUserId === state.user?.id ||
    (state.user?.siteId === r.siteId &&
      ['staff_member', 'site_manager'].includes(state.user?.role.code || ''))
  )
})

const canEscalateTm = computed(
  () =>
    request.value?.status === 'under_review' &&
    request.value.priority === 'standard' &&
    can('escalate_request_to_territory_manager'),
)

const canEscalateCom = computed(
  () =>
    request.value?.status === 'under_review' &&
    can('escalate_request_to_country_ops_manager'),
)

const canResolve = computed(
  () => request.value?.status === 'approved' && can('resolve_request'),
)

onMounted(load)
</script>

<template>
  <div v-if="request" class="stack">
    <header>
      <p class="muted">
        <RouterLink to="/">← Dashboard</RouterLink>
      </p>
      <h1>{{ request.title }}</h1>
      <p class="muted">{{ request.type }} · age {{ request.ageInDays }} day(s)</p>
      <div class="row">
        <span class="badge" :class="request.priority">{{ request.priority }}</span>
        <span class="badge">{{ request.status }}</span>
      </div>
    </header>

    <section class="panel body">
      <h2>Details</h2>
      <p>{{ request.description }}</p>
      <dl class="meta">
        <div>
          <dt>Requester</dt>
          <dd>{{ request.requestingUser?.fullName }} ({{ request.requestingUser?.email }})</dd>
        </div>
        <div>
          <dt>Site</dt>
          <dd>
            {{ request.site?.name }}
            <span v-if="request.site?.territory">
              · {{ request.site.territory.name }}
              <span v-if="request.site.territory.country">
                · {{ request.site.territory.country.name }}
              </span>
            </span>
          </dd>
        </div>
        <div v-if="request.declineReason">
          <dt>Decline reason</dt>
          <dd>{{ request.declineReason }}</dd>
        </div>
        <div v-if="request.resolutionNote">
          <dt>Resolution note</dt>
          <dd>{{ request.resolutionNote }}</dd>
        </div>
      </dl>
    </section>

    <section class="panel body actions">
      <h2>Actions</h2>
      <p v-if="error" class="error">{{ error }}</p>
      <div class="row">
        <button
          v-if="canStartReview"
          class="btn"
          type="button"
          :disabled="busy"
          @click="run(() => api(`/requests/${id}/start-review`, { method: 'POST', json: {} }).then(() => undefined))"
        >
          Start review
        </button>
        <button
          v-if="canApprove"
          class="btn"
          type="button"
          :disabled="busy"
          @click="run(() => api(`/requests/${id}/approve`, { method: 'POST', json: {} }).then(() => undefined))"
        >
          Approve
        </button>
        <button
          v-if="canEscalateTm"
          class="btn secondary"
          type="button"
          :disabled="busy"
          @click="
            run(() =>
              api(`/requests/${id}/escalate/territory-manager`, { method: 'POST', json: {} }).then(
                () => undefined,
              ),
            )
          "
        >
          Escalate to Territory Manager
        </button>
        <button
          v-if="canEscalateCom"
          class="btn secondary"
          type="button"
          :disabled="busy"
          @click="
            run(() =>
              api(`/requests/${id}/escalate/country-ops-manager`, { method: 'POST', json: {} }).then(
                () => undefined,
              ),
            )
          "
        >
          Escalate to Country Ops Manager
        </button>
      </div>

      <div v-if="canRequestInfo" class="action-block">
        <label class="field">
          <span>Request additional info</span>
          <textarea v-model="question" />
        </label>
        <button
          class="btn secondary"
          type="button"
          :disabled="busy || !question.trim()"
          @click="
            run(() =>
              api(`/requests/${id}/request-info`, {
                method: 'POST',
                json: { question: question },
              }).then(() => {
                question = ''
              }),
            )
          "
        >
          Send info request
        </button>
      </div>

      <div v-if="canProvideInfo" class="action-block">
        <label class="field">
          <span>Provide information</span>
          <textarea v-model="responseText" />
        </label>
        <button
          class="btn"
          type="button"
          :disabled="busy || !responseText.trim()"
          @click="
            run(() =>
              api(`/requests/${id}/provide-info`, {
                method: 'POST',
                json: { response: responseText },
              }).then(() => {
                responseText = ''
              }),
            )
          "
        >
          Submit response
        </button>
      </div>

      <div v-if="canDecline" class="action-block">
        <label class="field">
          <span>Decline reason</span>
          <textarea v-model="declineReason" />
        </label>
        <button
          class="btn danger"
          type="button"
          :disabled="busy || !declineReason.trim()"
          @click="
            run(() =>
              api(`/requests/${id}/decline`, {
                method: 'POST',
                json: { reason: declineReason },
              }).then(() => {
                declineReason = ''
              }),
            )
          "
        >
          Decline
        </button>
      </div>

      <div v-if="canResolve" class="action-block">
        <label class="field">
          <span>Resolution note</span>
          <textarea v-model="resolutionNote" />
        </label>
        <button
          class="btn"
          type="button"
          :disabled="busy || !resolutionNote.trim()"
          @click="
            run(() =>
              api(`/requests/${id}/resolve`, {
                method: 'POST',
                json: { resolutionNote },
              }).then(() => {
                resolutionNote = ''
              }),
            )
          "
        >
          Resolve
        </button>
      </div>
    </section>

    <section v-if="infoMessages.length" class="panel body">
      <h2>Additional info exchange</h2>
      <ul class="timeline">
        <li v-for="m in infoMessages" :key="m.id">
          <strong>{{ m.messageType }}</strong>
          · {{ m.authorName }} · {{ new Date(m.createdAt).toLocaleString() }}
          <p>{{ m.body }}</p>
        </li>
      </ul>
    </section>

    <section v-if="audit.length" class="panel body">
      <h2>Audit history</h2>
      <ul class="timeline">
        <li v-for="entry in audit" :key="entry.id">
          <strong>{{ entry.action }}</strong>
          · {{ entry.actingUserDisplayName }} · {{ new Date(entry.createdAt).toLocaleString() }}
          <div class="muted">
            <span v-if="entry.previousStatus || entry.newStatus">
              {{ entry.previousStatus || '—' }} → {{ entry.newStatus || '—' }}
            </span>
            <span v-if="entry.note"> · {{ entry.note }}</span>
          </div>
        </li>
      </ul>
    </section>
  </div>
  <p v-else-if="error" class="error">{{ error }}</p>
  <p v-else class="muted">Loading…</p>
</template>

<style scoped>
.body {
  padding: 1.2rem 1.4rem;
}

.meta {
  display: grid;
  gap: 0.8rem;
  margin: 1rem 0 0;
}

.meta dt {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
}

.meta dd {
  margin: 0.15rem 0 0;
}

.actions .action-block {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--line);
}

.timeline {
  list-style: none;
  padding: 0;
  margin: 0;
}

.timeline li {
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--line);
}

.timeline p {
  margin: 0.35rem 0 0;
}
</style>
