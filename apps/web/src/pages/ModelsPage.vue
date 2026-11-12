<script setup lang="ts">
import { onMounted, ref, shallowRef } from "vue";
import { RouterLink } from "vue-router";
import type { ModelSummary } from "@wangshu/shared";
import ModelCard from "../components/ModelCard.vue";
import StateBlock from "../components/StateBlock.vue";
import { api, errorMessage } from "../lib/api";

const models = shallowRef<ModelSummary[]>([]);
const state = ref<"loading" | "ready" | "error" | "empty">("loading");
const error = ref("");

async function load(): Promise<void> {
  state.value = "loading";
  error.value = "";
  try {
    const list = await api.listModels();
    models.value = list;
    state.value = list.length > 0 ? "ready" : "empty";
  } catch (err) {
    error.value = errorMessage(err);
    state.value = "error";
  }
}

onMounted(() => {
  void load();
});
</script>

<template>
  <div class="page container">
    <header class="page-head">
      <p class="eyebrow">车型矩阵</p>
      <h1 class="page-title">两台车，两种生活</h1>
      <p class="page-sub">
        海豹是四门轿跑，把驾驶乐趣留在日常；汉 EV 是旗舰轿车，把东方审美和舒适放进通勤。均为纯电平台，配置与价格在配置器中实时计算。
      </p>
      <div class="models__actions">
        <RouterLink to="/wizard" class="btn btn--ghost btn--sm">不知道怎么选？试试选车向导</RouterLink>
        <RouterLink to="/compare" class="btn btn--ghost btn--sm">海豹 / 汉 EV 对比</RouterLink>
      </div>
    </header>

    <StateBlock
      :state="state"
      :error="error"
      loading-text="正在读取车型…"
      empty-title="暂无在售车型"
      empty-text="车型正在更新，请稍后再来。"
      @retry="load"
    >
      <p class="models__count"><span class="num">{{ models.length }}</span> 台在售</p>
      <div class="models__grid">
        <ModelCard v-for="model in models" :key="model.id" :model="model" />
      </div>
    </StateBlock>
  </div>
</template>

<style scoped>
.models__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.models__count {
  margin-bottom: var(--space-4);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.models__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-5);
}

@media (max-width: 1024px) {
  .models__grid {
    gap: var(--space-4);
  }
}

@media (max-width: 720px) {
  .models__grid {
    grid-template-columns: 1fr;
  }
}
</style>