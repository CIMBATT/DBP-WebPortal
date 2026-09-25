<script setup lang="ts">
import { ref } from 'vue'

const username = ref('')
const password = ref('')
const errorMessage = ref('')

const emit = defineEmits<{
  login: [username: string, password: string]
}>()

function handleLogin() {
  const user = username.value.trim()
  const pass = password.value.trim()

  if (!user) {
    errorMessage.value = 'Please enter a username'
    return
  }

  if (!pass) {
    errorMessage.value = 'Please enter a password'
    return
  }

  errorMessage.value = ''
  emit('login', user, pass)
}
</script>

<template>
  <section class="login-section">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="brand-icon">🔋</div>
          <h1>Battery Passport</h1>
          <p>Digital Product Portal</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="Enter your username"
              @keyup.enter="handleLogin"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter your password"
              @keyup.enter="handleLogin"
            />
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button type="submit" class="login-button">Sign In</button>
        </form>

        <div class="demo-hint">
          <p><strong>Demo credentials:</strong></p>
          <p>Username: <code>admin</code></p>
          <p>Password: <code>password</code></p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.login-section {
  display: grid;
  place-items: center;
  min-height: calc(100vh - 64px);
  padding: 40px 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  padding: 40px 32px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.brand-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.login-header h1 {
  margin: 0 0 6px;
  font-size: 1.8rem;
  color: #0f172a;
}

.login-header p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.login-form {
  display: grid;
  gap: 20px;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
}

input {
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 12px 14px;
  font: inherit;
  background: white;
  color: #0f172a;
  font-size: 1rem;
}

input:focus {
  outline: 3px solid rgba(59, 130, 246, 0.14);
  border-color: #3b82f6;
}

.error-message {
  padding: 12px 14px;
  border-radius: 8px;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  font-size: 0.9rem;
  font-weight: 600;
}

.login-button {
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
  font: inherit;
  font-weight: 600;
  font-size: 1rem;
  padding: 12px 24px;
  cursor: pointer;
  min-height: 48px;
  transition: background 0.2s ease;
}

.login-button:hover {
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
}

.login-button:active {
  transform: scale(0.98);
}

.demo-hint {
  padding: 16px;
  border-radius: 12px;
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
  font-size: 0.85rem;
  color: #0369a1;
}

.demo-hint p {
  margin: 0 0 8px;
}

.demo-hint p:last-child {
  margin-bottom: 0;
}

.demo-hint code {
  background: rgba(255, 255, 255, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-weight: 600;
}
</style>
