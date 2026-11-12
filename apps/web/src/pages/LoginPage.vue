<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { errorMessage } from "../lib/api";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const email = ref("");
const password = ref("");
const submitting = ref(false);
const error = ref("");

function redirectTarget(): string {
  const raw = typeof route.query.redirect === "string" ? route.query.redirect : "";
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account";
}

async function submit(): Promise<void> {
  error.value = "";
  if (!email.value.trim() || !password.value) {
    error.value = "请填写邮箱和密码";
    return;
  }
  submitting.value = true;
  try {
    await auth.login(email.value.trim(), password.value);
    await router.replace(redirectTarget());
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="page container auth-page">
    <div class="auth-card">
      <p class="eyebrow">登录</p>
      <h1 class="page-title">回到你的车鉴</h1>
      <p class="page-sub">登录后可查看自己的订单；演示环境，请勿使用真实敏感密码。</p>

      <form class="auth-form" @submit.prevent="submit">
        <div class="field">
          <label class="field__label" for="login-email">邮箱</label>
          <input id="login-email" v-model="email" class="input" type="email" autocomplete="email" placeholder="you@example.com" />
        </div>
        <div class="field">
          <label class="field__label" for="login-password">密码</label>
          <input id="login-password" v-model="password" class="input" type="password" autocomplete="current-password" placeholder="至少 8 位" />
        </div>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button type="submit" class="btn btn--primary btn--lg btn--block" :disabled="submitting">
          {{ submitting ? "登录中…" : "登录" }}
        </button>
      </form>

      <p class="auth-switch">还没有账号？<RouterLink to="/register">注册一个</RouterLink></p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  padding-block: var(--space-8);
}

.auth-card {
  width: min(460px, 100%);
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-5);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field__label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.input {
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--text);
  outline: none;
}

.input:focus {
  border-color: var(--accent);
}

.form-error {
  color: var(--danger);
  font-size: 13px;
}

.auth-switch {
  margin-top: var(--space-4);
  color: var(--muted);
  font-size: 13px;
}

.auth-switch a {
  color: var(--accent);
}
</style>