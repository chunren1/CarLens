<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import type { ModelSummary, Trim } from "@wangshu/shared";
import SpecTable from "../components/SpecTable.vue";
import StateBlock from "../components/StateBlock.vue";
import { api, errorCode, errorMessage } from "../lib/api";
import { money } from "../lib/format";
import { assetUrl } from "../lib/assets";

type ModelDetail = ModelSummary & { trims: Trim[] };

const route = useRoute();
const slug = computed(() => String(route.params.slug ?? ""));
const model = shallowRef<ModelDetail | null>(null);
const state = ref<"loading" | "ready" | "error" | "empty">("loading");
const error = ref("");
const errorStatus = ref("");

async function load(): Promise<void> {
  state.value = "loading";
  error.value = "";
  errorStatus.value = "";
  try {
    const detail = await api.getModel(slug.value);
    model.value = detail;
    state.value = detail.trims.length > 0 ? "ready" : "empty";
  } catch (err) {
    model.value = null;
    error.value = errorMessage(err);
    errorStatus.value = errorCode(err);
    state.value = "error";
  }
}

onMounted(() => {
  void load();
});

watch(slug, () => {
  void load();
});

const emptyTitle = computed(() =>
  errorStatus.value === "MODEL_NOT_FOUND" || errorStatus.value === "NOT_FOUND"
    ? "车型不存在"
    : "暂无车型信息",
);
</script>

<template>
  <div class="model-page">
    <StateBlock
      :state="state"
      :error="error"
      :empty-title="emptyTitle"
      empty-text="可能车型已下架，请回到车型矩阵重新选择。"
      @retry="load"
    >
      <template v-if="model">
        <section class="detail-hero">
          <img :src="assetUrl(model.heroImage)" :alt="model.name + ' ' + model.body" class="detail-hero__image" />
          <div class="detail-hero__scrim" aria-hidden="true"></div>
          <div class="container detail-hero__inner">
            <RouterLink to="/models" class="back-link">‹ 车型矩阵</RouterLink>
            <p class="eyebrow">{{ model.enName }}</p>
            <h1 class="detail-hero__title">{{ model.name }}</h1>
            <p class="detail-hero__tagline">{{ model.tagline }}</p>
            <p class="detail-hero__meta">
              <span>{{ model.body }}</span>
              <span aria-hidden="true">·</span>
              <span>{{ model.segment }}</span>
              <span aria-hidden="true">·</span>
              <span>{{ model.seats }} 座</span>
            </p>
            <div class="detail-hero__actions">
              <RouterLink
                :to="{ name: 'configurator', params: { slug: model.slug } }"
                class="btn btn--primary btn--lg"
              >
                配置 {{ model.name }}
              </RouterLink>
              <p class="detail-hero__price">
                <span class="num">{{ money(model.priceFrom) }}</span>
                <span class="muted">起</span>
              </p>
            </div>
          </div>
        </section>

        <div class="container detail-body">
          <section class="section">
            <div class="section-head">
              <div>
                <p class="eyebrow">参数</p>
                <h2 class="section-title">一眼看清</h2>
              </div>
            </div>
            <SpecTable :model="model" :trims="model.trims" />
          </section>

          <section class="section">
            <div class="section-head">
              <div>
                <p class="eyebrow">版本</p>
                <h2 class="section-title">三种性格</h2>
              </div>
              <p class="section-sub">价格为基础配置，选装与税费在配置器中实时计算。</p>
            </div>

            <div class="trim-grid">
              <article v-for="trim in model.trims" :key="trim.id" class="trim-card">
                <div class="trim-card__head">
                  <h3 class="trim-card__name">{{ trim.name }}</h3>
                  <p class="trim-card__price num">{{ money(trim.price) }}</p>
                </div>
                <dl class="trim-card__specs">
                  <div>
                    <dt>续航</dt>
                    <dd class="num">{{ trim.rangeKm }} km</dd>
                  </div>
                  <div>
                    <dt>零百</dt>
                    <dd class="num">{{ trim.zero100 }} s</dd>
                  </div>
                  <div>
                    <dt>功率</dt>
                    <dd class="num">{{ trim.powerKw }} kW</dd>
                  </div>
                </dl>
                <RouterLink
                  :to="{ name: 'configurator', params: { slug: model.slug }, query: { trim: String(trim.id) } }"
                  class="btn btn--ghost btn--sm trim-card__cta"
                >
                  选择此版本
                </RouterLink>
              </article>
            </div>

            <p class="detail-note muted">
              部分选装存在版本限制（例如 21 英寸轮毂需搭配性能版本），配置器会实时提示。
            </p>
          </section>
        </div>
      </template>
    </StateBlock>
  </div>
</template>

<style scoped>
.detail-hero {
  position: relative;
  overflow: hidden;
  min-height: 520px;
  display: flex;
  align-items: flex-end;
  border-bottom: 1px solid var(--line);
}

.detail-hero__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 66%;
}

.detail-hero__scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(7, 9, 12, 0.55) 0%, rgba(7, 9, 12, 0.25) 38%, rgba(7, 9, 12, 0.94) 100%),
    linear-gradient(90deg, rgba(7, 9, 12, 0.65), transparent 60%);
}

.detail-hero__inner {
  position: relative;
  color: #fff;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding-block: var(--space-7);
}

.back-link {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--muted);
  transition: color var(--duration-2) var(--ease);
}

.back-link:hover {
  color: var(--accent);
}

.detail-hero__title {
  font-size: clamp(44px, 6vw, 72px);
  letter-spacing: 0.04em;
}

.detail-hero__tagline {
  max-width: 46ch;
  color: rgba(255, 255, 255, 0.8);
  font-size: 15px;
}

.detail-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.62);
}

.detail-hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-5);
  margin-top: var(--space-3);
}

.detail-hero__price {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  font-size: 20px;
  color: var(--accent);
}

.detail-note {
  margin-top: var(--space-4);
  font-size: 12px;
}

.trim-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.trim-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
  transition: border-color var(--duration-3) var(--ease), transform var(--duration-4) var(--ease);
}

.trim-card:hover {
  border-color: rgba(215, 25, 32, 0.45);
  transform: translateY(-2px);
}

.trim-card__head {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.trim-card__name {
  font-size: 22px;
}

.trim-card__price {
  font-size: 14px;
  color: var(--accent);
}

.trim-card__specs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  margin: 0;
  padding-top: var(--space-4);
  border-top: 1px solid var(--line);
}

.trim-card__specs dt {
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.trim-card__specs dd {
  margin: 2px 0 0;
  font-size: 13px;
}

.trim-card__cta {
  margin-top: auto;
}

@media (max-width: 1024px) {
  .trim-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .detail-hero {
    min-height: 440px;
  }

  .detail-hero__inner {
    padding-block: var(--space-6);
  }
}
</style>