<script setup lang="ts">
import type { QuoteResult } from "@wangshu/shared";
import { money, priceSuffix } from "../lib/format";

defineProps<{ quote: QuoteResult; showTaxDetail?: boolean }>();
</script>

<template>
  <section class="summary card" aria-label="配置与价格明细">
    <header class="summary__head">
      <div>
        <p class="summary__title">{{ quote.model.name }} · {{ quote.trim.name }}</p>
        <p class="summary__sub">
          {{ quote.model.enName }} · {{ quote.model.body }} · 续航 {{ quote.rangeKm }} km
        </p>
      </div>
      <div class="summary__total">
        <span class="summary__total-label">落地价</span>
        <span class="num summary__total-value">{{ money(quote.total) }}</span>
      </div>
    </header>

    <div class="summary__options">
      <div class="opt">
        <span class="opt__label">车漆</span>
        <span class="opt__dot" :style="{ background: quote.paint.hex }" aria-hidden="true"></span>
        <span class="opt__name">{{ quote.paint.name }}</span>
        <span class="opt__price num">{{ priceSuffix(quote.paint.price) }}</span>
      </div>
      <div class="opt">
        <span class="opt__label">轮毂</span>
        <span class="opt__dot opt__dot--empty" aria-hidden="true"></span>
        <span class="opt__name">{{ quote.wheel.sizeInch }} 英寸 · {{ quote.wheel.name }}</span>
        <span class="opt__price num">{{ priceSuffix(quote.wheel.price) }}</span>
      </div>
      <div class="opt">
        <span class="opt__label">内饰</span>
        <span class="opt__dot" :style="{ background: quote.interior.hex }" aria-hidden="true"></span>
        <span class="opt__name">{{ quote.interior.name }}</span>
        <span class="opt__price num">{{ priceSuffix(quote.interior.price) }}</span>
      </div>
      <div v-for="item in quote.packages" :key="item.id" class="opt">
        <span class="opt__label">选装</span>
        <span class="opt__dot opt__dot--empty" aria-hidden="true"></span>
        <span class="opt__name">{{ item.name }}</span>
        <span class="opt__price num">{{ priceSuffix(item.price) }}</span>
      </div>
      <div v-if="quote.packages.length === 0" class="opt">
        <span class="opt__label">选装</span>
        <span class="opt__dot opt__dot--empty" aria-hidden="true"></span>
        <span class="opt__name muted">未加选装包</span>
      </div>
    </div>

    <div class="summary__body">
      <table class="lines">
        <caption class="sr-only">配置项价格</caption>
        <tbody>
          <tr v-for="line in quote.lines" :key="line.key">
            <th scope="row">{{ line.label }}</th>
            <td class="num">{{ money(line.amount) }}</td>
          </tr>
        </tbody>
      </table>

      <dl class="totals">
        <div class="totals__row">
          <dt>裸车价</dt>
          <dd class="num">{{ money(quote.subtotal) }}</dd>
        </div>
        <div v-if="showTaxDetail" class="totals__row totals__row--sub">
          <dt>全额购置税</dt>
          <dd class="num">{{ money(quote.taxFull) }}</dd>
        </div>
        <div v-if="showTaxDetail" class="totals__row totals__row--sub">
          <dt>新能源减半减免</dt>
          <dd class="num totals__relief">- {{ money(quote.taxRelief) }}</dd>
        </div>
        <div class="totals__row">
          <dt>实缴购置税</dt>
          <dd class="num">{{ money(quote.tax) }}</dd>
        </div>
        <div class="totals__row">
          <dt>保险</dt>
          <dd class="num">{{ money(quote.insurance) }}</dd>
        </div>
        <div class="totals__row">
          <dt>上牌</dt>
          <dd class="num">{{ money(quote.registration) }}</dd>
        </div>
        <div class="totals__row totals__row--grand">
          <dt>落地价</dt>
          <dd class="num">{{ money(quote.total) }}</dd>
        </div>
        <div class="totals__row">
          <dt>定金（模拟支付）</dt>
          <dd class="num">{{ money(quote.deposit) }}</dd>
        </div>
      </dl>
    </div>

    <div v-if="quote.warnings.length > 0" class="summary__warnings" role="note">
      <p v-for="warning in quote.warnings" :key="warning">{{ warning }}</p>
    </div>
  </section>
</template>

<style scoped>
.summary {
  overflow: hidden;
}

.summary__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-5) var(--space-4);
  border-bottom: 1px solid var(--line);
}

.summary__title {
  font-family: var(--font-display);
  font-size: 22px;
  letter-spacing: 0.03em;
}

.summary__sub {
  margin-top: var(--space-1);
  color: var(--muted);
  font-size: 12px;
  font-family: var(--font-mono);
  letter-spacing: 0.02em;
}

.summary__total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.summary__total-label {
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--muted);
}

.summary__total-value {
  font-size: 26px;
  color: var(--accent);
}

.summary__options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  background: var(--line);
  border-bottom: 1px solid var(--line);
}

.opt {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--surface);
}

.opt__label {
  flex: 0 0 34px;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.opt__dot {
  flex: 0 0 auto;
  width: 12px;
  height: 12px;
  border: 1px solid rgba(237, 242, 248, 0.25);
  border-radius: 50%;
}

.opt__dot--empty {
  border-style: dashed;
  border-color: var(--line);
  background: transparent;
}

.opt__name {
  font-size: 13px;
  min-width: 0;
}

.opt__price {
  margin-left: auto;
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

.summary__body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: start;
  gap: var(--space-6);
  padding: var(--space-5);
}

.lines {
  width: 100%;
}

.lines th,
.lines td {
  padding-block: 10px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
  font-weight: 400;
  text-align: left;
}

.lines th {
  color: var(--muted);
}

.lines td {
  text-align: right;
  color: var(--text);
}

.totals {
  margin: 0;
}

.totals__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  padding-block: var(--space-2);
  border-bottom: 1px solid rgba(34, 43, 54, 0.65);
  font-size: 13px;
}

.totals__row dt {
  color: var(--muted);
}

.totals__row dd {
  margin: 0;
}

.totals__row--sub {
  font-size: 12px;
  padding-block: var(--space-1);
}

.totals__row--sub dt {
  color: #6f7c8c;
}

.totals__relief {
  color: var(--ok);
}

.totals__row--grand {
  padding-block: var(--space-3);
  border-bottom: 0;
}

.totals__row--grand dt {
  color: var(--text);
  font-family: var(--font-display);
  font-size: 15px;
}

.totals__row--grand dd {
  font-size: 20px;
  color: var(--accent);
}

.summary__warnings {
  padding: var(--space-3) var(--space-5);
  border-top: 1px solid rgba(224, 108, 117, 0.35);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 12px;
}

@media (max-width: 1024px) {
  .summary__body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .summary__options {
    grid-template-columns: 1fr;
  }

  .summary__head {
    padding: var(--space-4);
  }

  .summary__total {
    align-items: flex-start;
  }

  .summary__body {
    padding: var(--space-4);
  }

  .opt {
    padding: var(--space-3) var(--space-4);
  }
}
</style>