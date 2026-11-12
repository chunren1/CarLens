<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { errorMessage } from "../lib/api";

const auth = useAuthStore();
const router = useRouter();
const name = ref("");
const email = ref("");
const password = ref("");
const confirm = ref("");
const submitting = ref(false);
const error = ref("");

async function submit(): Promise<void> {
  error.value = "";
  if (name.value.trim().length < 2) {
    error.value = "昵称至少 2 个字符";
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    error.value = "邮箱格式不正确";
    return;
  }
  if (password.value.length < 8) {
    error.value = "密码至少 8 位";
    return;
  }
  if (password.value !== confirm.value) {
    error.value = "两次输入的密码不一致";
    return;
  }
  submitting.value = true;
  try {
    await auth.register({ name: name.value.trim(), email: email.value.trim(), password: password.value });
    await router.replace("/account");
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
      <p class="eyebrow">注册</p>
      <h1 class="page-title">建一个车鉴账户</h1>
      <p class="page-sub">用于查看订单与保存配置；演示环境，请勿使用真实敏感信息。</p>

      <form class="auth-form" @submit.prevent="submit">
        <div class="field">
          <label class="field__label" for="register-name">昵称</label>
          <input id="register-name" v-model="name" class="input" maxlength="30" placeholder="怎么称呼你" />
        </div>
        <div class="field">
          <label class="field__label" for="register-email">邮箱</label>
          <input id="register-email" v-model="email" class="input" type="email" autocomplete="email" placeholder="you@example.com" />
        </div>
        <div class="field">
          <label class="field__label" for="register-password">密码</label>
          <input id="register-password" v-model="password" class="input" type="password" autocomplete="new-password" placeholder="至少 8 位" />
        </div>
        <div class="field">
          <label class="field__label" for="register-confirm">确认密码</label>
          <input id="register-confirm" v-model="confirm" class="input" type="password" autocomplete="new-password" placeholder="再输一次" />
        </div>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button type="submit" class="btn btn--primary btn--lg btn--block" :disabled="submitting">
          {{ submitting ? "注册中…" : "注册并登录" }}
        </button>
      </form>

      <p class="auth-switch">已经有账号？<RouterLink to="/login">直接登录</RouterLink></p>
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