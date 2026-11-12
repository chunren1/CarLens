<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import type { Order } from "@wangshu/shared";
import ConfigSummary from "../components/ConfigSummary.vue";
import StatusTimeline from "../components/StatusTimeline.vue";
import StateBlock from "../components/StateBlock.vue";
import { api, errorCode, errorMessage } from "../lib/api";
import { formatDateTime, maskPhone, money } from "../lib/format";
import { ORDER_STATUS_LABEL, statusTone } from "../lib/order";

const route = useRoute();
const orderNo = computed(() => String(route.params.orderNo ?? ""));
const order = shallowRef<Order | null>(null);
const state = ref<"loading" | "ready" | "error" | "empty">("loading");
const error = ref("");
const errorStatus = ref("");
const cancelling = ref(false);
const cancelError = ref("");

async function cancel(): Promise<void> {
  if (!order.value) return;
  if (!window.confirm("取消这笔订单？取消后需重新下订。")) return;
  cancelling.value = true;
  cancelError.value = "";
  try {
    order.value = await api.cancelOrder(order.value.orderNo);
  } catch (err) {
    cancelError.value = errorMessage(err);
  } finally {
    cancelling.value = false;
  }
}

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

const statusHint = computed(() => {
  switch (order.value?.status) {
    case "pending_payment":
      return "订单已创建，支付定金后进入备车流程。";
    case "paid":
      return "定金已支付，门店将在 24 小时内与你确认交付时间。";
    case "confirmed":
      return "门店已确认订单，正在排产备车。";
    case "delivered":
      return "车辆已交付，感谢使用车鉴。";
    case "cancelled":
      return "订单已取消，如有疑问请联系门店。";
    default:
      return "";
  }
});
</script>

<template>
  <div class="page container order-page">
    <StateBlock
      :state="state"
      :error="error"
      :empty-title="emptyTitle"
      empty-text="订单号可能已失效，请从下订流程重新创建订单。"
      @retry="load"
    >
      <template v-if="order">
        <header class="order-head">
          <div class="order-head__main">
            <p class="eyebrow">订单详情 · ORDER</p>
            <h1 class="page-title">
              订单 <span class="num order-head__no">{{ order.orderNo }}</span>
            </h1>
            <p class="page-sub">
              下单于 {{ formatDateTime(order.createdAt) }} · 定金 {{ money(order.deposit) }} · 车辆总价 {{ money(order.total) }}
            </p>
          </div>
          <div class="order-head__side">
            <span class="badge" :class="'badge--' + statusTone(order.status)">
              {{ ORDER_STATUS_LABEL[order.status] }}
            </span>
            <RouterLink
              v-if="order.status === 'pending_payment'"
              :to="{ name: 'pay', params: { orderNo: order.orderNo } }"
              class="btn btn--primary"
            >
              去支付定金
            </RouterLink>
          </div>
        </header>

        <p class="order-hint" :class="'order-hint--' + statusTone(order.status)">{{ statusHint }}</p>
        <p v-if="cancelError" class="order-error" role="alert">{{ cancelError }}</p>

        <div class="order-grid">
          <div class="order-main">
            <section class="order-block card">
              <h2 class="order-block__title">状态时间线</h2>
              <StatusTimeline :status="order.status" :created-at="order.createdAt" :paid-at="order.paidAt" />
            </section>

            <section class="order-section">
              <div class="order-section__head">
                <p class="eyebrow">配置快照</p>
                <h2 class="order-section__title">你选的这台车</h2>
                <p class="order-section__sub">下单时由服务端冻结，后续改价不影响本单金额。</p>
              </div>
              <ConfigSummary :quote="order.config" />
            </section>
          </div>

          <aside class="order-side">
            <section class="order-block card">
              <h2 class="order-block__title">购车人</h2>
              <dl class="order-info">
                <div>
                  <dt>姓名</dt>
                  <dd>{{ order.customerName }}</dd>
                </div>
                <div>
                  <dt>手机号</dt>
                  <dd class="num">{{ maskPhone(order.phone) }}</dd>
                </div>
                <div>
                  <dt>创建时间</dt>
                  <dd>{{ formatDateTime(order.createdAt) }}</dd>
                </div>
                <div>
                  <dt>支付时间</dt>
                  <dd>{{ formatDateTime(order.paidAt) }}</dd>
                </div>
              </dl>
            </section>

            <section class="order-block card">
              <h2 class="order-block__title">交付门店</h2>
              <p class="order-store__name">{{ order.store.name }}</p>
              <p class="order-store__line">{{ order.store.city }} · {{ order.store.address }}</p>
              <p class="order-store__line">{{ order.store.phone }}</p>
              <p class="order-store__line">营业时间 {{ order.store.hours }}</p>
            </section>

            <section class="order-block card">
              <h2 class="order-block__title">金额</h2>
              <dl class="order-info">
                <div>
                  <dt>车辆总价</dt>
                  <dd class="num">{{ money(order.total) }}</dd>
                </div>
                <div>
                  <dt>定金</dt>
                  <dd class="num">{{ money(order.deposit) }}</dd>
                </div>
                <div>
                  <dt>支付状态</dt>
                  <dd>{{ order.paidAt ? "已支付" : "未支付" }}</dd>
                </div>
              </dl>
              <p class="order-note">金额由服务端按配置快照重新计算，前端不参与定价。</p>
            </section>

            <div class="order-actions">
              <RouterLink
                v-if="order.status === 'pending_payment'"
                :to="{ name: 'pay', params: { orderNo: order.orderNo } }"
                class="btn btn--primary btn--block"
              >
                去模拟支付
              </RouterLink>
              <button
                v-if="order.status === 'pending_payment'"
                type="button"
                class="btn btn--ghost btn--block"
                :disabled="cancelling"
                @click="cancel"
              >
                {{ cancelling ? "正在取消…" : "取消订单" }}
              </button>
              <button type="button" class="btn btn--ghost btn--block" @click="load">刷新订单状态</button>
              <RouterLink to="/models" class="btn btn--ghost btn--block">继续看车</RouterLink>
            </div>
          </aside>
        </div>
      </template>
    </StateBlock>
  </div>
</template>

<style scoped>
.order-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.order-head__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.order-head__no {
  font-size: 0.6em;
  letter-spacing: 0.04em;
  color: var(--accent-2);
  word-break: break-all;
}

.order-head__side {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.order-hint {
  margin-bottom: var(--space-5);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--muted);
  font-size: 13px;
}

.order-hint--pending {
  border-color: rgba(78, 177, 221, 0.4);
  background: var(--accent-soft);
  color: var(--accent);
}

.order-hint--ok {
  border-color: rgba(111, 207, 151, 0.35);
  background: var(--ok-soft);
  color: var(--ok);
}

.order-hint--danger {
  border-color: rgba(224, 108, 117, 0.4);
  background: var(--danger-soft);
  color: var(--danger);
}

.order-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: var(--space-5);
  align-items: start;
}

.order-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.order-block {
  padding: var(--space-5);
}

.order-block__title {
  margin-bottom: var(--space-4);
  font-size: 18px;
  letter-spacing: 0.04em;
}

.order-section__head {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-4);
}

.order-section__title {
  font-size: 22px;
}

.order-section__sub {
  color: var(--muted);
  font-size: 12px;
}

.order-side {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
}

.order-info div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  font-size: 12px;
}

.order-info dt {
  color: var(--muted);
  white-space: nowrap;
}

.order-info dd {
  margin: 0;
  text-align: right;
  word-break: break-all;
}

.order-store__name {
  font-family: var(--font-display);
  font-size: 18px;
}

.order-store__line {
  margin-top: var(--space-1);
  color: var(--muted);
  font-size: 12px;
}

.order-note {
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 11px;
  line-height: 1.7;
}

.order-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

@media (max-width: 1024px) {
  .order-grid {
    grid-template-columns: 1fr;
  }

  .order-block {
    padding: var(--space-4);
  }
}
.order-error {
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border: 1px solid rgba(224, 108, 117, 0.4);
  border-radius: var(--radius-sm);
  color: var(--danger);
  font-size: 13px;
}

</style>