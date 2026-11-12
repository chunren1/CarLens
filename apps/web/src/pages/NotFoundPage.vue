<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <div class="page container not-found">
    <p class="eyebrow">404 · NOT FOUND</p>
    <h1 class="not-found__title">这里没有车</h1>
    <p class="page-sub">
      你访问的页面不存在，可能链接已失效。回到首页，或者直接去看两台在售车型。
    </p>
    <div class="not-found__actions">
      <RouterLink to="/" class="btn btn--primary">返回首页</RouterLink>
      <RouterLink to="/models" class="btn btn--ghost">浏览车型</RouterLink>
    </div>
    <p class="not-found__code num" aria-hidden="true">404</p>
  </div>
</template>

<style scoped>
.not-found {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
  padding-block: var(--space-8);
}

.not-found__title {
  font-size: clamp(40px, 6vw, 64px);
}

.not-found__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.not-found__code {
  position: absolute;
  right: var(--space-6);
  bottom: var(--space-5);
  font-size: clamp(80px, 16vw, 200px);
  line-height: 1;
  color: rgba(34, 43, 54, 0.55);
  pointer-events: none;
  user-select: none;
}

@media (max-width: 720px) {
  .not-found__code {
    display: none;
  }
}
</style>
