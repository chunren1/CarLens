<script setup lang="ts">
import { computed } from "vue";
import type { QuoteResult } from "@wangshu/shared";
import { money } from "../../lib/format";

const props = defineProps<{
  quote: QuoteResult | null;
  quoteState: "idle" | "loading" | "ready" | "error";
  error: string;
}>();

const emit = defineEmits<{ save: []; quote: []; order: [] }>();

const blocked = computed(() => props.quote === null || props.error.length > 0);
const updating = computed(() => props.quoteState === "loading");
</script>

<template>
  <div class="price-bar" role="region" aria-label="价格与操作">
    <div class="container">
      <p v-if="error" class="price-bar__error" role="alert">{{ error }}</p>
      <div class="price-bar__inner" :class="{ 'price-bar__inner--updating': updating }">
        <dl class="prices">
          <div class="price">
            <dt>裸车</dt>
            <dd class="num">{{ quote ? money(quote.subtotal) : "—" }}</dd>
          </div>
          <div class="price">
            <dt>购置税</dt>
            <dd class="num">{{ quote ? money(quote.tax) : "—" }}</dd>
          </div>
          <div class="price">
            <dt>保险</dt>
            <dd class="num">{{ quote ? money(quote.insurance) : "—" }}</dd>
          </div>
          <div class="price price--total">
            <dt>落地</dt>
            <dd class="num">{{ quote ? money(quote.total) : "—" }}</dd>
          </div>
        </dl>

        <div class="price-bar__actions">
          <button type="button" class="btn btn--ghost btn--sm" :disabled="blocked" @click="emit('save')">
            保存配置
          </button>
          <button type="button" class="btn btn--accent btn--sm" :disabled="blocked" @click="emit('quote')">
            生成报价单
          </button>
          <button type="button" class="btn btn--primary" :disabled="blocked" @click="emit('order')">
            立即下订
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.price-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  border-top: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 -10px 30px rgba(17, 24, 39, 0.06);
  backdrop-filter: blur(18px) saturate(140%);
}

.price-bar__error {
  padding-top: var(--space-3);
  color: var(--danger);
  font-size: 12px;
}

.price-bar__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4) var(--space-6);
  padding-block: var(--space-4);
  transition: opacity var(--duration-2) var(--ease);
}

.price-bar__inner--updating {
  opacity: 0.72;
}

.prices {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-6);
  margin: 0;
}

.price {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.price dt {
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--muted);
}

.price dd {
  margin: 0;
  font-size: 15px;
}

.price--total dt {
  color: var(--accent);
}

.price--total dd {
  font-size: 22px;
  color: var(--accent);
}

.price-bar__actions {
  display: flex;
  gap: var(--space-2);
  margin-left: auto;
}

@media (max-width: 1024px) {
  .price-bar__inner {
    gap: var(--space-3);
  }

  .prices {
    gap: var(--space-2) var(--space-5);
  }

  .price dd {
    font-size: 14px;
  }

  .price--total dd {
    font-size: 19px;
  }
}

@media (max-width: 720px) {
  .price-bar__inner {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
    padding-block: var(--space-3);
  }

  .prices {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-2);
  }

  .price dd {
    font-size: 13px;
  }

  .price--total dd {
    font-size: 16px;
  }

  .price-bar__actions {
    margin-left: 0;
  }

  .price-bar__actions .btn {
    flex: 1;
    min-height: 42px;
    padding: 0 var(--space-3);
    font-size: 13px;
  }
}
</style>