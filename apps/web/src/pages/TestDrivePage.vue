<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef } from "vue";
import { RouterLink, useRoute } from "vue-router";
import type { ModelSummary, Store, TestDriveResult } from "@wangshu/shared";
import StateBlock from "../components/StateBlock.vue";
import { api, errorMessage } from "../lib/api";

const route = useRoute();
const models = shallowRef<ModelSummary[]>([]);
const stores = shallowRef<Store[]>([]);
const state = ref<"loading" | "ready" | "error" | "empty">("loading");
const loadError = ref("");
const submitting = ref(false);
const submitError = ref("");
const result = shallowRef<TestDriveResult | null>(null);

const form = reactive({
  name: "",
  phone: "",
  modelSlug: "",
  storeId: 0,
  slot: "",
});

const selectedModel = computed(() => models.value.find((model) => model.slug === form.modelSlug));
const selectedStore = computed(() => stores.value.find((store) => store.id === form.storeId));

async function load(): Promise<void> {
  state.value = "loading";
  loadError.value = "";
  try {
    const [modelList, storeList] = await Promise.all([api.listModels(), api.listStores()]);
    models.value = modelList;
    stores.value = storeList;
    const queryModel = String(route.query.model ?? "");
    const queryStore = Number(route.query.store ?? 0);
    form.modelSlug = modelList.some((model) => model.slug === queryModel)
      ? queryModel
      : modelList[0]?.slug ?? "";
    form.storeId = storeList.some((store) => store.id === queryStore)
      ? queryStore
      : storeList[0]?.id ?? 0;
    state.value = modelList.length > 0 && storeList.length > 0 ? "ready" : "empty";
  } catch (err) {
    loadError.value = errorMessage(err);
    state.value = "error";
  }
}

function validate(): string {
  if (form.name.trim().length < 2) return "请填写 2–30 个字符的姓名";
  if (!/^1[3-9]\d{9}$/.test(form.phone.trim())) return "请填写 11 位大陆手机号";
  if (!form.modelSlug) return "请选择车型";
  if (!form.storeId) return "请选择门店";
  if (!form.slot) return "请选择期望到店时间";
  return "";
}

async function submit(): Promise<void> {
  submitError.value = "";
  const message = validate();
  if (message) {
    submitError.value = message;
    return;
  }
  submitting.value = true;
  try {
    result.value = await api.createTestDrive({
      name: form.name.trim(),
      phone: form.phone.trim(),
      modelSlug: form.modelSlug,
      storeId: form.storeId,
      slot: form.slot.replace("T", " "),
    });
  } catch (err) {
    submitError.value = errorMessage(err);
  } finally {
    submitting.value = false;
  }
}

function reset(): void {
  result.value = null;
  submitError.value = "";
}

onMounted(() => {
  void load();
});
</script>

<template>
  <div class="page container">
    <header class="page-head">
      <p class="eyebrow">预约试驾</p>
      <h1 class="page-title">把一次心动，变成一次试驾</h1>
      <p class="page-sub">
        填写信息后，门店顾问会在 24 小时内与你确认时间。试驾不收取费用，也不代表下单。
      </p>
    </header>

    <StateBlock
      :state="state"
      :error="loadError"
      loading-text="正在准备试驾预约…"
      empty-title="暂不可预约"
      empty-text="车型或门店信息正在维护，请稍后再来。"
      @retry="load"
    >
      <div v-if="result" class="result-panel">
        <p class="eyebrow">预约已提交</p>
        <h2 class="result-panel__title">我们已收到你的试驾申请</h2>
        <dl class="result-panel__meta">
          <div><dt>预约编号</dt><dd class="num">TD{{ String(result.id).padStart(6, "0") }}</dd></div>
          <div><dt>车型</dt><dd>{{ selectedModel?.name }}</dd></div>
          <div><dt>门店</dt><dd>{{ selectedStore?.name }}</dd></div>
          <div><dt>期望时间</dt><dd>{{ result.slot }}</dd></div>
        </dl>
        <p class="result-panel__note">演示环境：预约会写入本地数据库，但不会真的安排顾问联系。</p>
        <div class="result-panel__actions">
          <button type="button" class="btn btn--primary" @click="reset">再预约一次</button>
          <RouterLink :to="{ name: 'configurator', params: { slug: form.modelSlug } }" class="btn btn--ghost">
            先去看看配置器
          </RouterLink>
        </div>
      </div>

      <div v-else class="testdrive-layout">
        <form class="form" @submit.prevent="submit">
          <div class="field">
            <label class="field__label" for="td-name">姓名</label>
            <input id="td-name" v-model="form.name" class="input" maxlength="30" placeholder="请输入真实姓名" />
          </div>
          <div class="field">
            <label class="field__label" for="td-phone">手机号</label>
            <input id="td-phone" v-model="form.phone" class="input" inputmode="tel" maxlength="11" placeholder="11 位手机号" />
          </div>
          <div class="field">
            <label class="field__label" for="td-model">意向车型</label>
            <select id="td-model" v-model="form.modelSlug" class="input">
              <option v-for="model in models" :key="model.slug" :value="model.slug">{{ model.name }} · {{ model.body }}</option>
            </select>
          </div>
          <div class="field">
            <label class="field__label" for="td-store">试驾门店</label>
            <select id="td-store" v-model.number="form.storeId" class="input">
              <option v-for="store in stores" :key="store.id" :value="store.id">{{ store.city }} · {{ store.name }}</option>
            </select>
          </div>
          <div class="field">
            <label class="field__label" for="td-slot">期望到店时间</label>
            <input id="td-slot" v-model="form.slot" class="input" type="datetime-local" />
          </div>
          <p v-if="submitError" class="form__error" role="alert">{{ submitError }}</p>
          <button type="submit" class="btn btn--primary btn--lg btn--block" :disabled="submitting">
            {{ submitting ? "正在提交…" : "提交试驾预约" }}
          </button>
          <p class="form__legal">演示环境：预约信息仅用于本地演示，不会发送给真实门店。</p>
        </form>

        <aside class="side">
          <p class="eyebrow">你可以期待</p>
          <h2 class="side__title">一次不被打扰的试驾</h2>
          <ul class="side__list">
            <li>顾问先确认时间，不电话轰炸</li>
            <li>静态体验 + 城市道路试驾</li>
            <li>配置与报价可当场在手机上完成</li>
            <li>试驾不收取任何费用</li>
          </ul>
          <RouterLink to="/stores" class="side__link">查看全部门店 →</RouterLink>
        </aside>
      </div>
    </StateBlock>
  </div>
</template>

<style scoped>
.testdrive-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: var(--space-6);
  align-items: start;
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field__label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.input {
  width: 100%;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--text);
  outline: none;
  transition: border-color var(--duration-2) var(--ease);
}

.input:focus {
  border-color: var(--accent);
}

.form__error {
  color: var(--danger);
  font-size: 13px;
}

.form__legal {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.7;
}

.side {
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: linear-gradient(160deg, rgba(78, 177, 221, 0.08), transparent 60%), var(--surface);
}

.side__title {
  margin-top: var(--space-2);
  font-size: 24px;
}

.side__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: var(--space-4) 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}

.side__list li::before {
  content: "·";
  margin-right: 8px;
  color: var(--accent);
}

.side__link {
  color: var(--accent-2);
  font-size: 13px;
}

.result-panel {
  max-width: 720px;
  padding: var(--space-7);
  border: 1px solid rgba(111, 207, 151, 0.35);
  border-radius: var(--radius-md);
  background: linear-gradient(150deg, rgba(111, 207, 151, 0.08), transparent 62%), var(--surface);
}

.result-panel__title {
  margin-top: var(--space-2);
  font-size: 28px;
}

.result-panel__meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin: var(--space-5) 0;
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
}

.result-panel__meta dt {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.result-panel__meta dd {
  margin: 4px 0 0;
  font-size: 14px;
}

.result-panel__note {
  color: var(--muted);
  font-size: 12px;
}

.result-panel__actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

@media (max-width: 900px) {
  .testdrive-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .result-panel__meta {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 721px) {
  .form > .btn--block {
    width: auto;
    max-width: 320px;
  }
}
</style>