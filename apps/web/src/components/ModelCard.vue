<script setup lang="ts">
import type { ModelSummary } from "@wangshu/shared";
import { assetUrl } from "../lib/assets";
import { RouterLink } from "vue-router";
import { money } from "../lib/format";

defineProps<{ model: ModelSummary }>();
</script>

<template>
  <article class="model-card">
    <RouterLink :to="{ name: 'model', params: { slug: model.slug } }" class="model-card__media">
      <img :src="assetUrl(model.heroImage)" :alt="model.name + ' ' + model.body" loading="lazy" />
      <span class="model-card__tag">{{ model.segment }}</span>
    </RouterLink>

    <div class="model-card__body">
      <div class="model-card__head">
        <div>
          <p class="model-card__en">{{ model.enName }}</p>
          <h3 class="model-card__name">{{ model.name }}</h3>
        </div>
        <p class="model-card__price">
          <span class="num">{{ money(model.priceFrom) }}</span>
          <span class="model-card__price-unit">起</span>
        </p>
      </div>

      <p class="model-card__tagline">{{ model.tagline }}</p>

      <dl class="model-card__meta">
        <div><dt>车身</dt><dd>{{ model.body }}</dd></div>
        <div><dt>座位</dt><dd>{{ model.seats }} 座</dd></div>
        <div><dt>定位</dt><dd>{{ model.segment }}</dd></div>
      </dl>

      <div class="model-card__actions">
        <RouterLink :to="{ name: 'configurator', params: { slug: model.slug } }" class="btn btn--primary btn--sm">
          开始配置
        </RouterLink>
        <RouterLink :to="{ name: 'model', params: { slug: model.slug } }" class="btn btn--ghost btn--sm">
          了解详情
        </RouterLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.model-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
  transition: border-color var(--duration-3) var(--ease), transform var(--duration-4) var(--ease);
}

.model-card:hover {
  border-color: rgba(78, 177, 221, 0.45);
  transform: translateY(-3px);
}

.model-card__media {
  position: relative;
  display: block;
  overflow: hidden;
  aspect-ratio: 16 / 10;
  background: var(--surface-2);
}

.model-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 62%;
  transform: scale(1.08);
  transform-origin: 50% 58%;
  transition: transform var(--duration-5) var(--ease);
}

.model-card:hover .model-card__media img {
  transform: scale(1.14);
}

.model-card__tag {
  position: absolute;
  top: var(--space-4);
  left: var(--space-4);
  padding: 3px 10px;
  border: 1px solid rgba(237, 242, 248, 0.18);
  border-radius: var(--radius-pill);
  background: rgba(7, 9, 12, 0.55);
  backdrop-filter: blur(6px);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  color: #fff;
}

.model-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
}

.model-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.model-card__en {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.24em;
  color: var(--muted);
}

.model-card__name {
  margin-top: var(--space-1);
  font-size: 26px;
}

.model-card__price {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  color: var(--accent);
  white-space: nowrap;
}

.model-card__price-unit {
  font-size: 11px;
  color: var(--muted);
}

.model-card__tagline {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.8;
}

.model-card__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
  margin: 0;
  padding-top: var(--space-4);
  border-top: 1px solid var(--line);
}

.model-card__meta dt {
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--muted);
}

.model-card__meta dd {
  margin: 2px 0 0;
  font-family: var(--font-mono);
  font-size: 12px;
}

.model-card__actions {
  display: flex;
  gap: var(--space-2);
  margin-top: auto;
  padding-top: var(--space-2);
}

@media (max-width: 640px) {
  .model-card__name {
    font-size: 22px;
  }

  .model-card__actions {
    flex-wrap: wrap;
  }
}
</style>