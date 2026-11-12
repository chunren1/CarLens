<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from "vue";
import { RouterLink } from "vue-router";
import type { ModelDetail } from "../lib/api";
import { api, errorMessage } from "../lib/api";
import { money } from "../lib/format";
import { assetUrl } from "../lib/assets";

const details = shallowRef<ModelDetail[]>([]);
const state = ref<"loading" | "ready" | "error">("loading");
const error = ref("");

const models = computed(() => details.value);

function range(model: ModelDetail): string {
  const values = model.trims.map((trim) => trim.rangeKm);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? String(min) : min + "–" + max;
}

function bestZero(model: ModelDetail): string {
  return String(Math.min(...model.trims.map((trim) => trim.zero100)));
}

function maxPower(model: ModelDetail): number {
  return Math.max(...model.trims.map((trim) => trim.powerKw));
}

async function load(): Promise<void> {
  state.value = "loading";
  error.value = "";
  try {
    const list = await api.listModels();
    const featured = ["tesla-model3", "xiaomi-su7", "zeekr-001"];
    const selected = featured
      .map((slug) => list.find((model) => model.slug === slug))
      .filter((model): model is NonNullable<typeof model> => Boolean(model));
    details.value = await Promise.all(selected.map((model) => api.getModel(model.slug)));
    state.value = "ready";
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
      <p class="eyebrow">车型对比</p>
      <h1 class="page-title">把三台车放在一张表里</h1>
      <p class="page-sub">跨品牌挑三台代表车型：特斯拉 Model 3、小米 SU7、极氪 001。同一套口径先看差异，再去配置器算价格。</p>
    </header>

    <div v-if="state === 'loading'" class="compare-state">正在读取车型…</div>
    <div v-else-if="state === 'error'" class="compare-state">{{ error }}</div>
    <div v-else class="compare-wrap">
      <table class="compare">
      <thead>
        <tr>
          <th scope="col">项目</th>
          <th v-for="model in models" :key="model.slug" scope="col">
            <p class="compare__en">{{ model.enName }}</p>
            <h2 class="compare__name">{{ model.name }}</h2>
            <p class="compare__body">{{ model.body }} · {{ model.seats }} 座</p>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">起售价</th>
          <td v-for="model in models" :key="model.slug" class="num compare__price">{{ money(model.priceFrom) }}</td>
        </tr>
        <tr>
          <th scope="row">市场定位</th>
          <td v-for="model in models" :key="model.slug">{{ model.segment }}</td>
        </tr>
        <tr>
          <th scope="row">CLTC 续航</th>
          <td v-for="model in models" :key="model.slug" class="num">{{ range(model) }} km</td>
        </tr>
        <tr>
          <th scope="row">最快零百</th>
          <td v-for="model in models" :key="model.slug" class="num">{{ bestZero(model) }} s</td>
        </tr>
        <tr>
          <th scope="row">最大功率</th>
          <td v-for="model in models" :key="model.slug" class="num">{{ maxPower(model) }} kW</td>
        </tr>
        <tr>
          <th scope="row">版本数</th>
          <td v-for="model in models" :key="model.slug" class="num">{{ model.trims.length }}</td>
        </tr>
        <tr>
          <th scope="row">适合谁</th>
          <td v-for="model in models" :key="model.slug">
            {{ model.tagline }}
          </td>
        </tr>
        <tr>
          <th scope="row"></th>
          <td v-for="model in models" :key="model.slug">
            <RouterLink :to="{ name: 'configurator', params: { slug: model.slug } }" class="btn btn--primary btn--sm">
              配置 {{ model.name }}
            </RouterLink>
          </td>
        </tr>
      </tbody>
      </table>
    </div>

    <div v-if="state === 'ready'" class="compare-mobile">
      <article v-for="model in models" :key="model.slug" class="compare-mobile__card">
        <img :src="assetUrl(model.heroImage)" :alt="model.name + ' 车型海报'" loading="lazy" />
        <div class="compare-mobile__body">
          <p class="eyebrow">{{ model.brand }}</p>
          <h2 class="compare-mobile__name">{{ model.name }}</h2>
          <p class="compare-mobile__tagline">{{ model.tagline }}</p>
          <dl class="compare-mobile__specs">
            <div><dt>起售价</dt><dd>{{ money(model.priceFrom) }}</dd></div>
            <div><dt>续航</dt><dd>{{ range(model) }} km</dd></div>
            <div><dt>最快零百</dt><dd>{{ bestZero(model) }} s</dd></div>
            <div><dt>最大功率</dt><dd>{{ maxPower(model) }} kW</dd></div>
            <div><dt>座位</dt><dd>{{ model.seats }} 座</dd></div>
            <div><dt>版本数</dt><dd>{{ model.trims.length }}</dd></div>
          </dl>
          <RouterLink :to="{ name: 'configurator', params: { slug: model.slug } }" class="btn btn--primary btn--sm">
            配置 {{ model.name }}
          </RouterLink>
        </div>
      </article>
    </div>

    <div class="compare-cta">
      <p class="eyebrow">还是选不出来？</p>
      <h2 class="section-title">让向导替你缩小范围</h2>
      <RouterLink to="/wizard" class="btn btn--primary">开始选车向导</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.compare-state {
  padding: var(--space-6);
  color: var(--muted);
}

.compare-wrap {
  overflow-x: auto;
  padding-bottom: var(--space-3);
}

.compare {
  border-top: 1px solid var(--line);
}

.compare th,
.compare td {
  padding: var(--space-4);
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: top;
}

.compare thead th {
  width: 40%;
}

.compare thead th:first-child,
.compare tbody th {
  width: 20%;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.compare__en {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--accent-2);
}

.compare__name {
  margin-top: 6px;
  font-size: 30px;
}

.compare__body {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
}

.compare__price {
  font-size: 22px;
  color: var(--accent);
}

.compare td {
  font-size: 14px;
}

.compare-cta {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-7);
  padding-top: var(--space-6);
  border-top: 1px solid var(--line);
}

.compare-mobile {
  display: none;
}

@media (max-width: 720px) {
  .compare-wrap {
    display: none;
  }

  .compare-mobile {
    display: grid;
    gap: var(--space-4);
  }

  .compare-mobile__card {
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .compare-mobile__card > img {
    width: 100%;
    aspect-ratio: 16 / 10;
    object-fit: cover;
  }

  .compare-mobile__body {
    padding: var(--space-4);
  }

  .compare-mobile__name {
    margin-top: 4px;
    font-family: var(--font-display);
    font-size: 24px;
  }

  .compare-mobile__tagline {
    margin-top: 6px;
    color: var(--muted);
    font-size: 13px;
  }

  .compare-mobile__specs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-block: var(--space-4);
  }

  .compare-mobile__specs dt {
    color: var(--muted);
    font-size: 10px;
  }

  .compare-mobile__specs dd {
    margin-top: 2px;
    font-family: var(--font-mono);
    font-size: 13px;
  }
}
</style>