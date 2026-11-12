<script setup lang="ts">
import { computed } from "vue";
import type { ModelSummary, Trim } from "@wangshu/shared";
import { money } from "../lib/format";

const props = defineProps<{ model: ModelSummary; trims: Trim[] }>();

const rows = computed(() => {
  const trims = props.trims;
  const maxRange = trims.length > 0 ? Math.max(...trims.map((trim) => trim.rangeKm)) : 0;
  const bestZero = trims.length > 0 ? Math.min(...trims.map((trim) => trim.zero100)) : 0;
  const maxPower = trims.length > 0 ? Math.max(...trims.map((trim) => trim.powerKw)) : 0;

  return [
    { label: "车身形式", value: props.model.body },
    { label: "市场定位", value: props.model.segment },
    { label: "座位数", value: props.model.seats + " 座" },
    { label: "在售版本", value: trims.length + " 个" },
    { label: "最长续航", value: maxRange + " km" },
    { label: "零百加速", value: bestZero + " s" },
    { label: "最大功率", value: maxPower + " kW" },
    { label: "起售价", value: money(props.model.priceFrom) + " 起" },
  ];
});
</script>

<template>
  <div class="spec-table card">
    <div v-for="row in rows" :key="row.label" class="spec-row">
      <span class="spec-row__label">{{ row.label }}</span>
      <span class="spec-row__value num">{{ row.value }}</span>
    </div>
  </div>
</template>

<style scoped>
.spec-table {
  max-width: 860px;
  padding: 0 var(--space-5);
  background: var(--surface-2);
}

.spec-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-5);
  padding-block: var(--space-4);
  border-bottom: 1px solid var(--line);
}

.spec-row:last-child {
  border-bottom: 0;
}

.spec-row__label {
  font-size: 13px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.spec-row__value {
  font-size: 14px;
  color: var(--text);
  text-align: right;
}

@media (max-width: 640px) {
  .spec-table {
    padding: 0 var(--space-4);
  }
}
</style>