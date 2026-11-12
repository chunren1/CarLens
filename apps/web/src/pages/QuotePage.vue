<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import ConfigSummary from "../components/ConfigSummary.vue";
import { readConfigSnapshot, type ConfigSnapshot } from "../lib/config-snapshot";
import { formatDateTime, money } from "../lib/format";

const router = useRouter();
const snapshot = ref<ConfigSnapshot | null>(null);
const loaded = ref(false);

onMounted(() => {
  snapshot.value = readConfigSnapshot();
  loaded.value = true;
});

const configuratorLink = computed(() => {
  const current = snapshot.value;
  if (!current) return "/models";
  return "/configurator/" + current.input.modelSlug + "?trim=" + current.input.trimId;
});

function handlePrint(): void {
  window.print();
}

function handleOrder(): void {
  void router.push({ name: "order-new" });
}
</script>

<template>
  <div class="page container quote-page">
    <p v-if="!loaded" class="quote-loading" role="status">正在读取本机保存的配置…</p>

    <div v-else-if="!snapshot" class="quote-empty">
      <p class="eyebrow">报价单</p>
      <h1 class="page-title">还没有可用的配置</h1>
      <p class="page-sub">
        先在配置器里选择版本、车漆与轮毂，生成报价单会保存在当前浏览器（sessionStorage），刷新不丢失。
      </p>
      <div class="quote-empty__actions">
        <RouterLink to="/models" class="btn btn--primary">去选车</RouterLink>
        <RouterLink to="/configurator/r1" class="btn btn--ghost">直接配置 海豹</RouterLink>
      </div>
    </div>

    <template v-else>
      <header class="quote-head">
        <div>
          <p class="eyebrow">报价单 · QUOTATION</p>
          <h1 class="page-title">{{ snapshot.quote.model.name }} 报价单</h1>
          <p class="page-sub">
            生成于 {{ formatDateTime(snapshot.savedAt) }} · 金额由服务端按配置实时计算，最终以订单为准。
          </p>
        </div>
        <div class="quote-head__actions no-print">
          <button type="button" class="btn btn--ghost" @click="handlePrint">打印 / 存 PDF</button>
          <button type="button" class="btn btn--primary" @click="handleOrder">立即下订</button>
        </div>
      </header>

      <ConfigSummary :quote="snapshot.quote" :show-tax-detail="true" />

      <div class="quote-foot no-print">
        <RouterLink :to="configuratorLink" class="btn btn--ghost">继续调整配置</RouterLink>
        <p class="quote-foot__note">
          定金 {{ money(snapshot.quote.deposit) }} · 模拟支付，不接商户，不产生真实扣款。
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.quote-loading {
  padding-block: var(--space-7);
  color: var(--muted);
  font-size: 13px;
}

.quote-empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
  padding-block: var(--space-7);
}

.quote-empty__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.quote-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.quote-head__actions {
  display: flex;
  gap: var(--space-2);
}

.quote-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.quote-foot__note {
  color: var(--muted);
  font-size: 12px;
}

@media print {
  .quote-page {
    padding: 0;
  }

  .quote-head {
    margin-bottom: var(--space-4);
  }

  .quote-page :deep(.summary) {
    border-color: #d8d8d8;
    background: #fff;
    color: #111;
  }

  .quote-page :deep(.summary__head),
  .quote-page :deep(.summary__options),
  .quote-page :deep(.summary__body) {
    border-color: #d8d8d8;
    background: #fff;
    color: #111;
  }

  .quote-page :deep(.opt) {
    background: #fff;
    color: #111;
  }

  .quote-page :deep(.opt__label),
  .quote-page :deep(.opt__price),
  .quote-page :deep(.lines th),
  .quote-page :deep(.totals__row dt),
  .quote-page :deep(.summary__sub) {
    color: #555;
  }

  .quote-page :deep(.summary__total-value),
  .quote-page :deep(.totals__row--grand dd),
  .quote-page :deep(.lines td),
  .quote-page :deep(.totals__row dd) {
    color: #111;
  }

  .quote-page :deep(.lines th),
  .quote-page :deep(.lines td),
  .quote-page :deep(.totals__row) {
    border-color: #ddd;
  }
}
</style>