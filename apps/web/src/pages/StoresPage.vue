<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from "vue";
import { RouterLink } from "vue-router";
import type { Store } from "@wangshu/shared";
import StateBlock from "../components/StateBlock.vue";
import { api, errorMessage } from "../lib/api";

const stores = shallowRef<Store[]>([]);
const state = ref<"loading" | "ready" | "error" | "empty">("loading");
const error = ref("");
const city = ref("全部");

const cities = computed(() => ["全部", ...new Set(stores.value.map((store) => store.city))]);
const filtered = computed(() =>
  city.value === "全部" ? stores.value : stores.value.filter((store) => store.city === city.value),
);

async function load(): Promise<void> {
  state.value = "loading";
  error.value = "";
  try {
    const list = await api.listStores();
    stores.value = list;
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
      <p class="eyebrow">门店查询</p>
      <h1 class="page-title">在离你最近的地方，看一次实车</h1>
      <p class="page-sub">
        车鉴聚合多品牌车型与门店信息；页面的门店、价格与预约均为演示数据，选城市查看后由门店顾问确认时间。
      </p>
    </header>

    <div class="city-filter" role="group" aria-label="按城市筛选">
      <button
        v-for="item in cities"
        :key="item"
        type="button"
        class="city-filter__btn"
        :class="{ 'city-filter__btn--active': city === item }"
        @click="city = item"
      >
        {{ item }}
      </button>
    </div>

    <StateBlock
      :state="state"
      :error="error"
      loading-text="正在读取门店…"
      empty-title="暂无门店"
      empty-text="门店信息正在维护，请稍后再来。"
      @retry="load"
    >
      <div class="store-grid">
        <article v-for="store in filtered" :key="store.id" class="store-card">
          <p class="store-card__city">{{ store.city }} · 车鉴合作门店</p>
          <h2 class="store-card__name">{{ store.name }}</h2>
          <p class="store-card__address">{{ store.address }}</p>
          <dl class="store-card__meta">
            <div>
              <dt>电话</dt>
              <dd><a :href="'tel:' + store.phone">{{ store.phone }}</a></dd>
            </div>
            <div>
              <dt>营业时间</dt>
              <dd>{{ store.hours }}</dd>
            </div>
          </dl>
          <div class="store-card__actions">
            <RouterLink :to="{ name: 'test-drive', query: { store: String(store.id) } }" class="btn btn--primary btn--sm">
              预约试驾
            </RouterLink>
            <a :href="'tel:' + store.phone" class="btn btn--ghost btn--sm">致电门店</a>
          </div>
        </article>
      </div>
    </StateBlock>

    <section class="stores-note">
      <p class="eyebrow">直营体系</p>
      <h2 class="section-title">价格一致，服务一致</h2>
      <p class="page-sub">
        所有门店执行统一的车价与选装价格；配置与报价可在线上完成，门店只负责体验、交付与售后。
      </p>
      <div class="stores-note__actions">
        <RouterLink to="/test-drive" class="btn btn--primary">预约试驾</RouterLink>
        <RouterLink to="/service" class="btn btn--ghost">车主服务</RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.city-filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.city-filter__btn {
  padding: 8px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  color: var(--muted);
  font-size: 13px;
  transition: all var(--duration-2) var(--ease);
}

.city-filter__btn:hover,
.city-filter__btn--active {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(78, 177, 221, 0.06);
}

.store-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.store-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.store-card__city {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--accent-2);
}

.store-card__name {
  font-size: 22px;
}

.store-card__address {
  color: var(--muted);
  font-size: 13px;
}

.store-card__meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
  margin: var(--space-2) 0;
  padding-top: var(--space-3);
  border-top: 1px solid var(--line);
}

.store-card__meta dt {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.store-card__meta dd {
  margin: 4px 0 0;
  font-size: 13px;
}

.store-card__actions {
  display: flex;
  gap: var(--space-2);
  margin-top: auto;
  padding-top: var(--space-3);
}

.stores-note {
  margin-top: var(--space-8);
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, rgba(78, 177, 221, 0.06), transparent 60%);
}

.stores-note__actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

@media (max-width: 720px) {
  .store-grid {
    grid-template-columns: 1fr;
  }
}
</style>