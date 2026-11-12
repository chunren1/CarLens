<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from "vue";
import { RouterLink, useRouter } from "vue-router";
import type { Store } from "@wangshu/shared";
import ConfigSummary from "../components/ConfigSummary.vue";
import StateBlock from "../components/StateBlock.vue";
import { api, errorMessage } from "../lib/api";
import { readConfigSnapshot, type ConfigSnapshot } from "../lib/config-snapshot";
import { money } from "../lib/format";

const router = useRouter();

const snapshot = shallowRef<ConfigSnapshot | null>(null);
const loaded = ref(false);

const stores = shallowRef<Store[]>([]);
const storeState = ref<"loading" | "ready" | "error" | "empty">("loading");
const storeError = ref("");

const name = ref("");
const phone = ref("");
const storeId = ref<number | null>(null);
const errors = ref<{ name?: string; phone?: string; store?: string }>({});
const submitting = ref(false);
const submitError = ref("");

async function loadStores(): Promise<void> {
  storeState.value = "loading";
  storeError.value = "";
  try {
    const list = await api.listStores();
    stores.value = list;
    storeState.value = list.length > 0 ? "ready" : "empty";
    if (list.length > 0 && storeId.value === null) {
      storeId.value = list[0]?.id ?? null;
    }
  } catch (err) {
    storeState.value = "error";
    storeError.value = errorMessage(err);
  }
}

onMounted(() => {
  snapshot.value = readConfigSnapshot();
  loaded.value = true;
  void loadStores();
});

const selectedStore = computed(
  () => stores.value.find((item) => item.id === storeId.value) ?? null,
);

function clearError(key: "name" | "phone" | "store"): void {
  errors.value[key] = undefined;
}

function validate(): boolean {
  const next: { name?: string; phone?: string; store?: string } = {};
  const trimmedName = name.value.trim();
  if (trimmedName.length < 2 || trimmedName.length > 30) {
    next.name = "请输入 2–30 个字符的姓名";
  }
  if (!/^1[3-9]\d{9}$/.test(phone.value.trim())) {
    next.phone = "请输入 11 位大陆手机号";
  }
  if (storeId.value === null) {
    next.store = "请选择交付门店";
  }
  errors.value = next;
  return Object.keys(next).length === 0;
}

async function submit(): Promise<void> {
  const current = snapshot.value;
  if (!current) return;
  if (!validate()) return;
  const targetStoreId = storeId.value;
  if (targetStoreId === null) return;

  submitting.value = true;
  submitError.value = "";
  try {
    const order = await api.createOrder({
      ...current.input,
      customerName: name.value.trim(),
      phone: phone.value.trim(),
      storeId: targetStoreId,
    });
    await router.push({ name: "pay", params: { orderNo: order.orderNo } });
  } catch (err) {
    submitError.value = errorMessage(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="page container">
    <p v-if="!loaded" class="order-loading" role="status">正在读取配置…</p>

    <div v-else-if="!snapshot" class="order-empty">
      <p class="eyebrow">下订</p>
      <h1 class="page-title">先配置一台车</h1>
      <p class="page-sub">下订需要使用配置器保存的配置快照。请先完成配置并生成报价单。</p>
      <div class="order-empty__actions">
        <RouterLink to="/models" class="btn btn--primary">去选车</RouterLink>
        <RouterLink to="/configurator/r1" class="btn btn--ghost">配置 海豹</RouterLink>
      </div>
    </div>

    <template v-else>
      <header class="page-head">
        <p class="eyebrow">下订 · ORDER</p>
        <h1 class="page-title">确认配置与门店</h1>
        <p class="page-sub">提交后生成待支付订单，并跳转模拟支付页。金额由服务端按配置快照重新计算。</p>
      </header>

      <form class="order-layout" novalidate @submit.prevent="submit">
        <section class="order-form card">
          <div class="order-form__head">
            <h2 class="order-form__title">购车人信息</h2>
            <span class="badge">演示环境不发送短信</span>
          </div>

          <div class="field">
            <label class="field__label" for="customer-name">姓名</label>
            <input
              id="customer-name"
              v-model="name"
              class="input"
              :class="{ 'input--invalid': errors.name }"
              type="text"
              autocomplete="name"
              placeholder="请输入真实姓名"
              @input="clearError('name')"
            />
            <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
          </div>

          <div class="field">
            <label class="field__label" for="customer-phone">手机号</label>
            <input
              id="customer-phone"
              v-model="phone"
              class="input"
              :class="{ 'input--invalid': errors.phone }"
              type="tel"
              inputmode="numeric"
              autocomplete="tel"
              maxlength="11"
              placeholder="11 位手机号"
              @input="clearError('phone')"
            />
            <p v-if="errors.phone" class="field__error">{{ errors.phone }}</p>
          </div>

          <div class="field">
            <label class="field__label" for="store">交付门店</label>
            <StateBlock
              :state="storeState"
              :error="storeError"
              loading-text="正在读取门店…"
              empty-title="暂无可选门店"
              empty-text="门店信息正在维护，请稍后重试。"
              :rows="2"
              @retry="loadStores"
            >
              <select id="store" v-model="storeId" class="select" @change="clearError('store')">
                <option v-for="item in stores" :key="item.id" :value="item.id">
                  {{ item.city }} · {{ item.name }}
                </option>
              </select>
            </StateBlock>
            <p v-if="errors.store" class="field__error">{{ errors.store }}</p>
            <p v-if="selectedStore" class="field__hint">
              {{ selectedStore.address }} · {{ selectedStore.phone }} · {{ selectedStore.hours }}
            </p>
          </div>

          <p class="order-form__note muted">
            订单仅持有订单号的人可查看；本演示不收集真实敏感信息，请勿填写他人手机号。
          </p>
        </section>

        <aside class="order-aside">
          <div class="order-deposit card">
            <p class="eyebrow">应付定金</p>
            <p class="order-deposit__amount num">{{ money(snapshot.quote.deposit) }}</p>
            <p class="order-deposit__hint">
              模拟支付网关，不接支付宝 / 微信商户，不产生真实扣款。
            </p>
            <ul class="order-deposit__meta">
              <li>
                <span>车型</span>
                <span>{{ snapshot.quote.model.name }} · {{ snapshot.quote.trim.name }}</span>
              </li>
              <li>
                <span>落地价</span>
                <span class="num">{{ money(snapshot.quote.total) }}</span>
              </li>
              <li>
                <span>定金</span>
                <span class="num">{{ money(snapshot.quote.deposit) }}</span>
              </li>
            </ul>
            <button
              type="submit"
              class="btn btn--primary btn--lg btn--block"
              :disabled="submitting || storeState !== 'ready'"
            >
              {{ submitting ? "正在创建订单…" : "提交订单并支付定金" }}
            </button>
            <p v-if="submitError" class="order-deposit__error" role="alert">{{ submitError }}</p>
            <p class="order-deposit__legal">
              提交即表示知悉：本系统为毕业设计演示，订单不构成真实购车合同。
            </p>
          </div>

          <ConfigSummary :quote="snapshot.quote" />
        </aside>
      </form>
    </template>
  </div>
</template>

<style scoped>
.order-loading {
  padding-block: var(--space-7);
  color: var(--muted);
  font-size: 13px;
}

.order-empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
  padding-block: var(--space-7);
}

.order-empty__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.order-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 440px;
  gap: var(--space-5);
  align-items: start;
}

.order-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-5);
}

.order-form__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--line);
}

.order-form__title {
  font-size: 24px;
}

.order-form__note {
  padding-top: var(--space-3);
  border-top: 1px solid var(--line);
  font-size: 12px;
  line-height: 1.8;
}

.order-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.order-deposit {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
}

.order-deposit__amount {
  font-size: 38px;
  line-height: 1.1;
  color: var(--accent);
}

.order-deposit__hint {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}

.order-deposit__meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-block: var(--space-3);
  border-block: 1px solid var(--line);
}

.order-deposit__meta li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  font-size: 12px;
}

.order-deposit__meta li span:first-child {
  color: var(--muted);
}

.order-deposit__error {
  padding: var(--space-2) var(--space-3);
  border: 1px solid rgba(224, 108, 117, 0.4);
  border-radius: var(--radius-sm);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 12px;
}

.order-deposit__legal {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.7;
}

@media (max-width: 1024px) {
  .order-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .order-form,
  .order-deposit {
    padding: var(--space-4);
  }

  .order-deposit__amount {
    font-size: 30px;
  }
}
</style>