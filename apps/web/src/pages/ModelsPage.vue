<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from "vue";
import { RouterLink } from "vue-router";
import type { ModelSummary } from "@wangshu/shared";
import ModelCard from "../components/ModelCard.vue";
import StateBlock from "../components/StateBlock.vue";
import { api, errorMessage } from "../lib/api";

const models = shallowRef<ModelSummary[]>([]);
const state = ref<"loading" | "ready" | "error" | "empty">("loading");
const error = ref("");
const activeBrand = ref("全部");

const brands = computed(() => ["全部", ...new Set(models.value.map((model) => model.brand))]);
const visibleModels = computed(() =>
  activeBrand.value === "全部"
    ? models.value
    : models.value.filter((model) => model.brand === activeBrand.value),
);

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
      <h1 class="page-title">多品牌，放在一起看</h1>
      <p class="page-sub">
        从比亚迪、特斯拉到小鹏、极氪、小米、蔚来、理想、问界、零跑、埃安，同一套口径比较车型、版本、配置与价格。
      </p>
      <div class="models__actions">
        <RouterLink to="/wizard" class="btn btn--ghost btn--sm">不知道怎么选？试试选车向导</RouterLink>
        <RouterLink to="/compare" class="btn btn--ghost btn--sm">跨品牌车型对比</RouterLink>
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
      <div class="models__brands" role="tablist" aria-label="品牌筛选">
        <button
          v-for="brand in brands"
          :key="brand"
          type="button"
          class="models__brand"
          :class="{ 'models__brand--active': activeBrand === brand }"
          :aria-selected="activeBrand === brand"
          role="tab"
          @click="activeBrand = brand"
        >
          {{ brand }}
        </button>
      </div>

      <p class="models__count">
        <span class="num">{{ visibleModels.length }}</span> 台在售
        <span v-if="activeBrand !== '全部'"> · {{ activeBrand }}</span>
      </p>
      <div class="models__grid">
        <ModelCard v-for="model in visibleModels" :key="model.id" :model="model" />
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

.models__brands {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: var(--space-4);
}

.models__brand {
  padding: 7px 13px;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  color: var(--muted);
  font-size: 12px;
}

.models__brand:hover,
.models__brand--active {
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-5);
}

@media (max-width: 1024px) {
  .models__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-4);
  }
}

@media (max-width: 720px) {
  .models__grid {
    grid-template-columns: 1fr;
  }
}
</style>