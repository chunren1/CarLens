<script setup lang="ts">
defineProps<{
  state: "loading" | "ready" | "error" | "empty";
  error?: string;
  loadingText?: string;
  emptyTitle?: string;
  emptyText?: string;
  rows?: number;
}>();

const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <div v-if="state === 'loading'" class="state" role="status" aria-live="polite">
    <span class="state__spinner" aria-hidden="true"></span>
    <p class="state__text">{{ loadingText ?? "正在加载…" }}</p>
    <div class="state__skeleton" aria-hidden="true">
      <span
        v-for="index in rows ?? 3"
        :key="index"
        class="skeleton state__bar"
        :style="{ width: 100 - index * 14 + '%' }"
      ></span>
    </div>
  </div>

  <div v-else-if="state === 'error'" class="state state--error" role="alert">
    <span class="state__icon" aria-hidden="true">!</span>
    <p class="state__title">加载失败</p>
    <p class="state__text">{{ error || "请稍后重试" }}</p>
    <button type="button" class="btn btn--ghost btn--sm" @click="emit('retry')">重试</button>
  </div>

  <div v-else-if="state === 'empty'" class="state state--empty">
    <p class="state__title">{{ emptyTitle ?? "暂无内容" }}</p>
    <p class="state__text">{{ emptyText || "换个条件再看看，或稍后再来。" }}</p>
    <slot name="empty-action" />
  </div>

  <slot v-else />
</template>

<style scoped>
.state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-6);
  border: 1px dashed var(--line);
  border-radius: var(--radius-md);
  background: var(--surface-2);
}

.state__spinner {
  width: 22px;
  height: 22px;
  border: 1px solid var(--line);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.state__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid rgba(224, 108, 117, 0.5);
  color: var(--danger);
  font-family: var(--font-mono);
  font-size: 13px;
}

.state__title {
  font-family: var(--font-display);
  font-size: 20px;
}

.state__text {
  color: var(--muted);
  font-size: 14px;
}

.state__skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: min(420px, 100%);
  margin-top: var(--space-2);
}

.state__bar {
  height: 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>