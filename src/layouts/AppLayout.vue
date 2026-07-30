<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { state, logout, can } = useAuth()

const links = computed(() => {
  const items = [{ to: '/', label: 'Dashboard' }]
  if (can('submit_standard_priority_request')) {
    items.push({ to: '/requests/new', label: 'New request' })
  }
  if (can('submit_standard_priority_request_on_behalf_of_the_staff')) {
    items.push({ to: '/requests/new-on-behalf', label: 'On behalf' })
  }
  if (can('view_user')) items.push({ to: '/users', label: 'Users' })
  if (can('platform_reporting')) items.push({ to: '/reports/platform', label: 'Platform report' })
  if (can('country_reporting')) items.push({ to: '/reports/country', label: 'Country report' })
  if (can('territory_reporting')) items.push({ to: '/reports/territory', label: 'Territory report' })
  if (can('site_reporting')) items.push({ to: '/reports/site', label: 'Site report' })
  return items
})

function onLogout() {
  logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="shell">
    <aside class="side panel">
      <div class="brand">
        <p class="brand-mark">Hyperoptimum</p>
        <h1>Request Desk</h1>
        <p class="muted scope">{{ state.user?.role.name }} · {{ state.user?.scopeType }}</p>
      </div>
      <nav>
        <RouterLink v-for="link in links" :key="link.to" :to="link.to">{{ link.label }}</RouterLink>
      </nav>
      <div class="side-foot">
        <p class="muted">{{ state.user?.fullName }}</p>
        <p class="muted email">{{ state.user?.email }}</p>
        <button class="btn secondary" type="button" @click="onLogout">Sign out</button>
      </div>
    </aside>
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
}

.side {
  padding: 1.5rem 1.2rem;
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: sticky;
  top: 0;
  height: 100vh;
}

.brand-mark {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.72rem;
  color: var(--accent);
}

.brand h1 {
  font-size: 1.8rem;
}

.scope {
  margin: 0;
  font-size: 0.9rem;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

nav a {
  color: var(--ink);
  padding: 0.45rem 0.55rem;
  border-left: 3px solid transparent;
}

nav a.router-link-active {
  border-left-color: var(--accent);
  background: rgba(47, 93, 74, 0.08);
  text-decoration: none;
  font-weight: 600;
}

.side-foot {
  margin-top: auto;
}

.email {
  margin: 0 0 0.8rem;
  font-size: 0.85rem;
}

.content {
  padding: 1.75rem 2rem 3rem;
}

@media (max-width: 900px) {
  .shell {
    grid-template-columns: 1fr;
  }

  .side {
    position: relative;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
