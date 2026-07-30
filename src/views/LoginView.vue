<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const email = ref('staff1@example.com')
const password = ref('Password123!')
const error = ref('')
const loading = ref(false)
const { login } = useAuth()
const router = useRouter()
const route = useRoute()

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await login(email.value, password.value)
    const redirect = (route.query.redirect as string) || '/'
    await router.push(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <section class="hero panel">
      <p class="eyebrow">Hyperoptimum</p>
      <h1>Request Desk</h1>
      <p class="lede">
        Operational requests with role-scoped decisions across platform, country, territory, and
        site.
      </p>
    </section>
    <form class="form panel" @submit.prevent="onSubmit">
      <h2>Sign in</h2>
      <label class="field">
        <span>Email</span>
        <input v-model="email" type="email" autocomplete="username" required />
      </label>
      <label class="field">
        <span>Password</span>
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn" type="submit" :disabled="loading">
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>
      <p class="muted hint">Seeded users use password <code>Password123!</code></p>
    </form>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1.5rem;
  padding: 2rem;
  align-items: stretch;
}

.hero,
.form {
  padding: 2.5rem;
}

.hero {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 70vh;
  background:
    linear-gradient(180deg, rgba(28, 36, 24, 0.08), rgba(28, 36, 24, 0.55)),
    url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80')
      center/cover;
  color: #f7f3ea;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.8rem;
  margin: 0 0 0.8rem;
}

.hero h1 {
  font-size: clamp(2.8rem, 6vw, 4.5rem);
  color: #f7f3ea;
}

.lede {
  max-width: 34rem;
  font-size: 1.1rem;
  line-height: 1.5;
  color: rgba(247, 243, 234, 0.9);
}

.form h2 {
  margin-bottom: 1.2rem;
}

.hint {
  margin-top: 1rem;
  font-size: 0.85rem;
}

@media (max-width: 900px) {
  .login {
    grid-template-columns: 1fr;
  }

  .hero {
    min-height: 40vh;
  }
}
</style>
