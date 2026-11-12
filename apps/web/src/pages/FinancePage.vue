<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from "vue";
import { RouterLink } from "vue-router";
import type { ModelSummary, Trim } from "@wangshu/shared";
import StateBlock from "../components/StateBlock.vue";
import { api, errorMessage, type ModelDetail } from "../lib/api";
import { money } from "../lib/format";

const models = shallowRef<ModelSummary[]>([]);
const detail = shallowRef<ModelDetail | null>(null);
const state = ref<"loading" | "ready" | "error" | "empty">("loading");
const error = ref("");
const slug = ref("");
const trimId = ref(0);
const downPercent = ref(30);
const months = ref(36);
const annualRate = ref(3.5);

const trims = computed<Trim[]>(() => detail.value?.trims ?? []);
const trim = computed(() => trims.value.find((item) => item.id === trimId.value) ?? trims.value[0]);
const price = computed(() => trim.value?.price ?? 0);
const downPayment = computed(() => Math.round((price.value * downPercent.value) / 100));
const principal = computed(() => price.value - downPayment.value);

const monthly = computed(() => {
  const n = months.value;
  const r = annualRate.value / 100 / 12;
  if (principal.value <= 0 || n <= 0) return 0;
  if (r <= 0) return Math.round(principal.value / n);
  return Math.round((principal.value * r) / (1 - Math.pow(1 + r, -n)));
});

const totalPayment = computed(() => monthly.value * months.value);
const totalInterest = computed(() => Math.max(0, totalPayment.value - principal.value));

async function loadModels(): Promise<void> {
  state.value = "loading";
  error.value = "";
  try {
    const list = await api.listModels();
    models.value = list;
    slug.value = list[0]?.slug ?? "";
    await loadDetail();
  } catch (err) {
    error.value = errorMessage(err);
    state.value = "error";
  }
}

async function loadDetail(): Promise<void> {
  if (!slug.value) return;
  state.value = "loading";
  error.value = "";
  try {
    const next = await api.getModel(slug.value);
    detail.value = next;
    trimId.value = next.trims[0]?.id ?? 0;
    state.value = next.trims.length > 0 ? "ready" : "empty";
  } catch (err) {
    error.value = errorMessage(err);
    state.value = "error";
  }
}

watch(slug, () => {
  void loadDetail();
});

onMounted(() => {
  void loadModels();
});

const steps = [
  { label: "首付", value: () => money(downPayment.value) },
  { label: "贷款本金", value: () => money(principal.value) },
  { label: "月供", value: () => money(monthly.value) },
  { label: "总利息", value: () => money(totalInterest.value) },
];
</script>

<template>
  <div class="page container">
    <header class="page-head">
      <p class="eyebrow">金融方案</p>
      <h1 class="page-title">把预算算清楚，再决定</h1>
      <p class="page-sub">
        选择车型与版本，调整首付比例、期限与年化利率，即时看到月供与总利息。测算为演示口径，不构成真实贷款承诺。
      </p>
    </header>

    <StateBlock
      :state="state"
      :error="error"
      loading-text="正在准备金融测算…"
      empty-title="暂不可测算"
      empty-text="车型信息正在维护，请稍后再来。"
      @retry="loadModels"
    >
      <div class="finance-layout">
        <section class="finance-form">
          <div class="field">
            <label class="field__label" for="finance-model">车型</label>
            <select id="finance-model" v-model="slug" class="input">
              <option v-for="model in models" :key="model.slug" :value="model.slug">{{ model.name }} · {{ model.body }}</option>
            </select>
          </div>
          <div class="field">
            <label class="field__label" for="finance-trim">版本</label>
            <select id="finance-trim" v-model.number="trimId" class="input">
              <option v-for="item in trims" :key="item.id" :value="item.id">{{ item.name }} · {{ money(item.price) }}</option>
            </select>
          </div>

          <div class="field">
            <span class="field__label">首付比例</span>
            <div class="option-row">
              <button
                v-for="value in [30, 40, 50, 60]"
                :key="value"
                type="button"
                class="option"
                :class="{ 'option--active': downPercent === value }"
                @click="downPercent = value"
              >
                {{ value }}%
              </button>
            </div>
          </div>

          <div class="field">
            <span class="field__label">贷款期限</span>
            <div class="option-row">
              <button
                v-for="value in [12, 24, 36, 48, 60]"
                :key="value"
                type="button"
                class="option"
                :class="{ 'option--active': months === value }"
                @click="months = value"
              >
                {{ value }} 期
              </button>
            </div>
          </div>

          <div class="field">
            <label class="field__label" for="finance-rate">年化利率（%）</label>
            <input id="finance-rate" v-model.number="annualRate" class="input" type="number" min="0" max="15" step="0.1" />
          </div>
        </section>

        <aside class="finance-result">
          <p class="eyebrow">测算结果</p>
          <p class="finance-result__price num">{{ money(price) }}</p>
          <p class="finance-result__hint">裸车价 · {{ trim?.name }}</p>

          <dl class="finance-result__grid">
            <div v-for="step in steps" :key="step.label">
              <dt>{{ step.label }}</dt>
              <dd class="num">{{ step.value() }}</dd>
            </div>
          </dl>

          <div class="finance-result__bar">
            <span :style="{ width: downPercent + '%' }" aria-hidden="true"></span>
          </div>
          <p class="finance-result__caption">首付 {{ money(downPayment) }} · 贷款 {{ money(principal) }}</p>

          <RouterLink
            :to="{ name: 'configurator', params: { slug }, query: { trim: String(trim?.id ?? '') } }"
            class="btn btn--primary btn--lg btn--block finance-result__cta"
          >
            带着预算去配置
          </RouterLink>
          <p class="finance-result__legal">
            演示测算：不含手续费、保险与税费；实际金融方案以门店与金融机构为准。
          </p>
        </aside>
      </div>
    </StateBlock>
  </div>
</template>

<style scoped>
.finance-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: var(--space-6);
  align-items: start;
}

.finance-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field__label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.input {
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--text);
  outline: none;
}

.input:focus {
  border-color: var(--accent);
}

.option-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.option {
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  color: var(--muted);
  font-size: 13px;
}

.option--active {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(78, 177, 221, 0.07);
}

.finance-result {
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: linear-gradient(165deg, rgba(78, 177, 221, 0.08), transparent 55%), var(--surface);
}

.finance-result__price {
  margin-top: var(--space-2);
  font-size: 34px;
  color: var(--accent);
}

.finance-result__hint {
  color: var(--muted);
  font-size: 12px;
}

.finance-result__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin: var(--space-5) 0;
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
}

.finance-result__grid dt {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.finance-result__grid dd {
  margin: 4px 0 0;
  font-size: 16px;
}

.finance-result__bar {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-2);
}

.finance-result__bar span {
  display: block;
  height: 100%;
  background: var(--accent);
}

.finance-result__caption {
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: 11px;
}

.finance-result__cta {
  margin-top: var(--space-5);
}

.finance-result__legal {
  margin-top: var(--space-3);
  color: var(--muted);
  font-size: 11px;
  line-height: 1.7;
}

@media (max-width: 900px) {
  .finance-layout {
    grid-template-columns: 1fr;
  }
}
</style>
