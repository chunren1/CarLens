<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import type { Order } from "@wangshu/shared";
import StateBlock from "../components/StateBlock.vue";
import { api, errorCode, errorMessage } from "../lib/api";
import { formatDateTime, money } from "../lib/format";
import { ORDER_STATUS_LABEL, statusTone } from "../lib/order";

const route = useRoute();
const router = useRouter();
const orderNo = computed(() => String(route.params.orderNo ?? ""));

const order = shallowRef<Order | null>(null);
const state = ref<"loading" | "ready" | "error" | "empty">("loading");
const error = ref("");
const errorStatus = ref("");

const paying = ref(false);
const payError = ref("");

async function load(): Promise<void> {
  state.value = "loading";
  error.value = "";
  errorStatus.value = "";
  try {
    const result = await api.getOrder(orderNo.value);
    order.value = result;
    state.value = "ready";
  } catch (err) {
    order.value = null;
    error.value = errorMessage(err);
    errorStatus.value = errorCode(err);
    state.value = "error";
  }
}

onMounted(() => {
  void load();
});

watch(orderNo, () => {
  void load();
});

const emptyTitle = computed(() =>
  errorStatus.value === "ORDER_NOT_FOUND" || errorStatus.value === "NOT_FOUND"
    ? "订单不存在"
    : "无法读取订单",
);

async function pay(): Promise<void> {
  const current = order.value;
  if (!current) return;
  paying.value = true;
  payError.value = "";
  try {
    const paid = await api.payOrder(current.orderNo);
    order.value = paid;
    await router.replace({ name: "order", params: { orderNo: paid.orderNo } });
  } catch (err) {
    payError.value = errorMessage(err);
  } finally {
    paying.value = false;
  }
}
</script>

<template>
  <div class="page container pay-page">
    <StateBlock
      :state="state"
      :error="error"
      :empty-title="emptyTitle"
      empty-text="请检查订单链接，或回到车型页重新下订。"
      @retry="load"
    >
      <template v-if="order">
        <div class="pay-demo" role="note">
          <span class="pay-demo__dot" aria-hidden="true"></span>
          <strong>演示环境 · 模拟支付</strong>
          <span>本页不接入支付宝 / 微信商户，不会产生任何真实扣款。</span>
        </div>

        <div class="pay-grid">
          <section class="pay-card card">
            <p class="eyebrow">模拟支付网关</p>
            <h1 class="pay-card__title">
              {{ order.status === "pending_payment" ? "支付订单定金" : "该订单已完成支付" }}
            </h1>

            <div class="pay-amount">
              <span class="pay-amount__label">定金</span>
              <span class="pay-amount__value num">{{ money(order.deposit) }}</span>
            </div>

            <dl class="pay-meta">
              <div>
                <dt>订单号</dt>
                <dd class="num pay-meta__order">{{ order.orderNo }}</dd>
              </div>
              <div>
                <dt>车辆总价</dt>
                <dd class="num">{{ money(order.total) }}</dd>
              </div>
              <div>
                <dt>下单时间</dt>
                <dd>{{ formatDateTime(order.createdAt) }}</dd>
              </div>
              <div>
                <dt>当前状态</dt>
                <dd>
                  <span class="badge" :class="'badge--' + statusTone(order.status)">
                    {{ ORDER_STATUS_LABEL[order.status] }}
                  </span>
                </dd>
              </div>
            </dl>

            <button
              v-if="order.status === 'pending_payment'"
              type="button"
              class="btn btn--primary btn--lg btn--block"
              :disabled="paying"
              @click="pay"
            >
              {{ paying ? "支付处理中…" : "确认模拟支付 " + money(order.deposit) }}
            </button>
            <RouterLink
              v-else
              :to="{ name: 'order', params: { orderNo: order.orderNo } }"
              class="btn btn--primary btn--lg btn--block"
            >
              查看订单状态
            </RouterLink>

            <p v-if="payError" class="pay-card__error" role="alert">{{ payError }}</p>
            <p class="pay-card__note">
              支付接口幂等：重复提交返回当前状态，不会重复写入支付记录。演示环境无真实扣款。
            </p>
          </section>

          <aside class="pay-aside">
            <div class="pay-aside__gateway card" aria-hidden="true">
              <span class="pay-aside__stamp">MOCK</span>
              <p>CarLens<br />PAYMENT GATEWAY</p>
              <span class="pay-aside__gateway-sub">DEMO ONLY · 不产生真实交易</span>
            </div>

            <div class="pay-aside__summary card">
              <p class="eyebrow">订单摘要</p>
              <p class="pay-aside__model">
                {{ order.config.model.name }} · {{ order.config.trim.name }}
              </p>
              <p class="pay-aside__sub muted">
                {{ order.config.paint.name }} · {{ order.config.wheel.name }} · {{ order.config.interior.name }}
              </p>
              <div class="pay-aside__store">
                <p class="pay-aside__store-name">{{ order.store.name }}</p>
                <p class="muted">{{ order.store.city }} · {{ order.store.address }}</p>
                <p class="muted">{{ order.store.phone }} · {{ order.store.hours }}</p>
              </div>
              <RouterLink to="/" class="btn btn--ghost btn--sm">返回首页</RouterLink>
            </div>
          </aside>
        </div>
      </template>
    </StateBlock>
  </div>
</template>

<style scoped>
.pay-demo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border: 1px solid rgba(215, 25, 32, 0.55);
  border-radius: var(--radius-md);
  background:
    repeating-linear-gradient(
      135deg,
      rgba(215, 25, 32, 0.06) 0 12px,
      transparent 12px 24px
    ),
    rgba(215, 25, 32, 0.06);
  color: var(--accent);
  font-size: 13px;
}

.pay-demo strong {
  font-family: var(--font-display);
  font-size: 16px;
  letter-spacing: 0.06em;
}

.pay-demo span:last-child {
  color: #cbb98e;
  font-size: 12px;
}

.pay-demo__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 4px rgba(215, 25, 32, 0.18);
}

.pay-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: var(--space-5);
  margin-top: var(--space-5);
  align-items: start;
}

.pay-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
}

.pay-card__title {
  font-size: clamp(26px, 3vw, 34px);
}

.pay-amount {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  padding-block: var(--space-3);
  border-block: 1px solid var(--line);
}

.pay-amount__label {
  font-size: 12px;
  letter-spacing: 0.14em;
  color: var(--muted);
}

.pay-amount__value {
  font-size: 44px;
  line-height: 1.1;
  color: var(--accent);
}

.pay-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
  margin: 0;
}

.pay-meta dt {
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.pay-meta dd {
  margin: var(--space-1) 0 0;
  font-size: 13px;
}

.pay-meta__order {
  letter-spacing: 0.06em;
  word-break: break-all;
}

.pay-card__error {
  padding: var(--space-2) var(--space-3);
  border: 1px solid rgba(224, 108, 117, 0.4);
  border-radius: var(--radius-sm);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 12px;
}

.pay-card__note {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.8;
}

.pay-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.pay-aside__gateway {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  aspect-ratio: 16 / 9;
  padding: var(--space-5);
  border-style: dashed;
  background:
    radial-gradient(60% 60% at 50% 40%, rgba(127, 166, 216, 0.1), transparent 70%),
    var(--surface);
  text-align: center;
  color: var(--accent-2);
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.18em;
  line-height: 1.8;
}

.pay-aside__stamp {
  padding: 2px 12px;
  border: 1px solid var(--accent-2);
  border-radius: var(--radius-xs);
  transform: rotate(-4deg);
  font-size: 22px;
  letter-spacing: 0.3em;
  color: var(--accent-2);
}

.pay-aside__gateway-sub {
  font-size: 9px;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.pay-aside__summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5);
}

.pay-aside__model {
  font-family: var(--font-display);
  font-size: 20px;
}

.pay-aside__sub {
  font-size: 12px;
}

.pay-aside__store {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-block: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--line);
  font-size: 12px;
}

.pay-aside__store-name {
  font-size: 13px;
  color: var(--text);
}

@media (max-width: 1024px) {
  .pay-grid {
    grid-template-columns: 1fr;
  }

  .pay-aside__gateway {
    aspect-ratio: 21 / 6;
  }
}

@media (max-width: 640px) {
  .pay-card {
    padding: var(--space-4);
  }

  .pay-amount__value {
    font-size: 34px;
  }

  .pay-meta {
    grid-template-columns: 1fr;
  }

  .pay-aside__gateway {
    aspect-ratio: 16 / 8;
  }
}
</style>