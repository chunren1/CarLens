<script setup lang="ts">
import { onMounted, ref, shallowRef } from "vue";
import { RouterLink, useRouter } from "vue-router";
import type { Order, OrderStatus } from "@wangshu/shared";
import { useAuthStore } from "../stores/auth";
import { api, errorMessage } from "../lib/api";
import { money } from "../lib/format";

const auth = useAuthStore();
const router = useRouter();
const orders = shallowRef<Order[]>([]);
const ready = ref(false);
const orderState = ref<"loading" | "ready" | "error">("loading");
const orderError = ref("");

const statusLabel: Record<OrderStatus, string> = {
  pending_payment: "待支付",
  paid: "已支付",
  confirmed: "已确认",
  delivered: "已交付",
  cancelled: "已取消",
};

async function loadOrders(): Promise<void> {
  orderState.value = "loading";
  orderError.value = "";
  try {
    orders.value = await api.listOrders();
    orderState.value = "ready";
  } catch (err) {
    orderError.value = errorMessage(err);
    orderState.value = "error";
  }
}

async function logout(): Promise<void> {
  await auth.logout();
  await router.push("/");
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

onMounted(async () => {
  const user = await auth.loadMe();
  if (!user) {
    await router.replace({ name: "login", query: { redirect: "/account" } });
    return;
  }
  ready.value = true;
  await loadOrders();
});
</script>

<template>
  <div class="page container">
    <div v-if="!ready" class="account-loading">正在读取账户…</div>

    <template v-else-if="auth.user">
      <header class="page-head">
        <p class="eyebrow">我的账户</p>
        <h1 class="page-title">{{ auth.user.name }}，欢迎回来</h1>
        <p class="page-sub">这里可以查看你的订单与配置入口。演示环境，数据仅保存在本地服务器。</p>
      </header>

      <div class="account-grid">
        <section class="account-card">
          <p class="eyebrow">资料</p>
          <dl class="profile">
            <div><dt>昵称</dt><dd>{{ auth.user.name }}</dd></div>
            <div><dt>邮箱</dt><dd>{{ auth.user.email }}</dd></div>
            <div><dt>角色</dt><dd>{{ auth.user.role === "admin" ? "管理员" : "车主" }}</dd></div>
            <div><dt>注册时间</dt><dd class="num">{{ formatDate(auth.user.createdAt) }}</dd></div>
          </dl>
          <button type="button" class="btn btn--ghost btn--sm" @click="logout">退出登录</button>
        </section>

        <section class="account-card">
          <p class="eyebrow">快捷入口</p>
          <div class="quick-links">
            <RouterLink to="/configurator/r1" class="quick-link"><span>配置 海豹</span><span aria-hidden="true">→</span></RouterLink>
            <RouterLink to="/configurator/s7" class="quick-link"><span>配置 汉 EV</span><span aria-hidden="true">→</span></RouterLink>
            <RouterLink to="/test-drive" class="quick-link"><span>预约试驾</span><span aria-hidden="true">→</span></RouterLink>
            <RouterLink to="/stores" class="quick-link"><span>门店查询</span><span aria-hidden="true">→</span></RouterLink>
            <RouterLink v-if="auth.user.role === 'admin'" to="/admin" class="quick-link"><span>管理后台</span><span aria-hidden="true">→</span></RouterLink>
          </div>
        </section>
      </div>

      <section class="orders">
        <div class="section-head">
          <div>
            <p class="eyebrow">订单</p>
            <h2 class="section-title">我的订单</h2>
          </div>
          <span class="muted orders__count">{{ orders.length }} 笔</span>
        </div>

        <div v-if="orderState === 'loading'" class="orders-state">正在读取订单…</div>
        <div v-else-if="orderState === 'error'" class="orders-state orders-state--error">
          {{ orderError }}
          <button type="button" class="btn btn--ghost btn--sm" @click="loadOrders">重试</button>
        </div>
        <div v-else-if="orders.length === 0" class="orders-empty">
          <p>还没有订单。</p>
          <RouterLink to="/models" class="btn btn--primary btn--sm">去看看车型</RouterLink>
        </div>
        <div v-else class="order-list">
          <article v-for="order in orders" :key="order.orderNo" class="order-card">
            <div class="order-card__main">
              <p class="order-card__no num">{{ order.orderNo }}</p>
              <h3 class="order-card__car">{{ order.config.model.name }} · {{ order.config.trim.name }}</h3>
              <p class="order-card__meta">{{ order.config.paint.name }} · {{ order.config.wheel.name }} · {{ order.store.name }}</p>
            </div>
            <div class="order-card__side">
              <span class="status" :class="'status--' + order.status">{{ statusLabel[order.status] }}</span>
              <p class="order-card__total num">{{ money(order.total) }}</p>
              <RouterLink :to="{ name: 'order', params: { orderNo: order.orderNo } }" class="btn btn--ghost btn--sm">
                查看订单
              </RouterLink>
            </div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.account-loading {
  padding: var(--space-8);
  color: var(--muted);
}

.account-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.account-card {
  padding: var(--space-5);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.profile {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: var(--space-4) 0;
}

.profile div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--line);
}

.profile dt {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.profile dd {
  margin: 0;
  font-size: 13px;
}

.quick-links {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.quick-link {
  display: flex;
  justify-content: space-between;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--line);
  font-size: 14px;
  transition: color var(--duration-2) var(--ease);
}

.quick-link:hover {
  color: var(--accent);
}

.orders {
  margin-top: var(--space-7);
}

.orders__count {
  font-family: var(--font-mono);
  font-size: 11px;
}

.orders-state,
.orders-empty {
  padding: var(--space-5);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-size: 13px;
}

.orders-empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.order-card {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.order-card__no {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--accent-2);
}

.order-card__car {
  margin-top: 4px;
  font-size: 19px;
}

.order-card__meta {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
}

.order-card__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
}

.order-card__total {
  font-size: 20px;
  color: var(--accent);
}

.status {
  padding: 2px 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.status--paid,
.status--confirmed,
.status--delivered {
  border-color: rgba(111, 207, 151, 0.4);
  color: var(--ok);
}

.status--pending_payment {
  border-color: rgba(215, 25, 32, 0.5);
  color: var(--accent);
}

@media (max-width: 900px) {
  .account-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .order-card {
    flex-direction: column;
  }

  .order-card__side {
    align-items: flex-start;
  }
}
</style>