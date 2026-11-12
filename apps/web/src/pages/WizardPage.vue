<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from "vue";
import { RouterLink } from "vue-router";
import type { ModelDetail } from "../lib/api";
import { api, errorMessage } from "../lib/api";
import { money } from "../lib/format";
import { assetUrl } from "../lib/assets";

type Budget = "entry" | "mid" | "high" | "flagship";
type Usage = "commute" | "family" | "long" | "performance";

const details = shallowRef<ModelDetail[]>([]);
const state = ref<"loading" | "ready" | "error">("loading");
const error = ref("");
const step = ref(0);
const budget = ref<Budget>("mid");
const usage = ref<Usage>("commute");
const seats = ref(5);
const result = ref<{ model: ModelDetail; trimId: number; reason: string } | null>(null);

const questions = [
  { title: "你的预算大概是多少？", hint: "含选装前的裸车预算，不含税费与保险。" },
  { title: "这台车主要用来做什么？", hint: "选一个最接近的场景，不需要想得太复杂。" },
  { title: "通常几个人坐车？", hint: "按最常用的场景选，偶尔满载不算。" },
];

const budgets: { value: Budget; label: string; note: string }[] = [
  { value: "entry", label: "30 万以内", note: "先解决有没有" },
  { value: "mid", label: "30–60 万", note: "主流预算" },
  { value: "high", label: "60–100 万", note: "想要更好的" },
  { value: "flagship", label: "100 万以上", note: "不设上限" },
];

const usages: { value: Usage; label: string; note: string }[] = [
  { value: "commute", label: "日常通勤", note: "好开、好停、省心" },
  { value: "family", label: "家庭出行", note: "空间与舒适优先" },
  { value: "long", label: "长途为主", note: "续航与补能" },
  { value: "performance", label: "驾驶乐趣", note: "加速与操控" },
];

const seatOptions = [
  { value: 2, label: "2 座", note: "两个人就够" },
  { value: 4, label: "4 座", note: "偶尔带人" },
  { value: 5, label: "5 座", note: "家庭刚需" },
];

const recommended = computed(() => {
  const r1 = details.value.find((model) => model.slug === "r1");
  const s7 = details.value.find((model) => model.slug === "s7");
  if (!r1 || !s7) return null;

  if (usage.value === "performance") {
    return { model: r1, reason: "你把驾驶乐趣放在第一位，海豹的四门轿跑姿态、后驱/四驱和 3.8 秒更对味。" };
  }
  if (usage.value === "family") {
    return { model: s7, reason: "家庭出行优先看后排与舒适性，汉 EV 的旗舰轿车车身更合适。" };
  }
  if (usage.value === "long") {
    return { model: s7, reason: "长途多，汉 EV 701 km 的续航更从容。" };
  }
  if (budget.value === "entry") {
    return { model: r1, reason: "预算优先，海豹起售价更低，日常配置并不将就。" };
  }
  return { model: s7, reason: "通勤为主、预算主流，汉 EV 的尺寸、舒适和续航更均衡。" };
});

function pickTrim(model: ModelDetail): number {
  if (usage.value === "performance") return model.trims[model.trims.length - 1]?.id ?? 0;
  if (usage.value === "long" || budget.value === "high") return model.trims[1]?.id ?? model.trims[0]?.id ?? 0;
  return model.trims[0]?.id ?? 0;
}

function next(): void {
  if (step.value < 2) {
    step.value += 1;
    return;
  }
  const pick = recommended.value;
  if (!pick) return;
  result.value = { model: pick.model, trimId: pickTrim(pick.model), reason: pick.reason };
}

function back(): void {
  if (step.value > 0) step.value -= 1;
}

function restart(): void {
  step.value = 0;
  result.value = null;
}

async function load(): Promise<void> {
  state.value = "loading";
  error.value = "";
  try {
    const [r1, s7] = await Promise.all([api.getModel("r1"), api.getModel("s7")]);
    details.value = [r1, s7];
    state.value = "ready";
  } catch (err) {
    error.value = errorMessage(err);
    state.value = "error";
  }
}

onMounted(() => {
  void load();
});
</script>

<template>
  <div class="page container">
    <header class="page-head">
      <p class="eyebrow">选车向导</p>
      <h1 class="page-title">三个问题，帮你缩小范围</h1>
      <p class="page-sub">
        没有“最好的车”，只有更适合你的车。回答三个问题，我们给出一个推荐和理由，不替你做决定。
      </p>
    </header>

    <div v-if="state === 'loading'" class="wizard-state">正在读取车型…</div>
    <div v-else-if="state === 'error'" class="wizard-state">{{ error }}</div>

    <div v-else-if="result" class="wizard-result">
      <p class="eyebrow">推荐结果</p>
      <h2 class="wizard-result__title">我们建议你看看 {{ result.model.name }}</h2>
      <p class="wizard-result__reason">{{ result.reason }}</p>
      <div class="wizard-result__card">
        <img :src="assetUrl(result.model.heroImage)" :alt="result.model.name" />
        <div>
          <p class="eyebrow">{{ result.model.enName }}</p>
          <h3>{{ result.model.name }}</h3>
          <p class="wizard-result__meta">{{ result.model.body }} · {{ result.model.seats }} 座 · {{ money(result.model.priceFrom) }} 起</p>
          <div class="wizard-result__actions">
            <RouterLink
              :to="{ name: 'configurator', params: { slug: result.model.slug }, query: { trim: String(result.trimId) } }"
              class="btn btn--primary"
            >
              去配置 {{ result.model.name }}
            </RouterLink>
            <button type="button" class="btn btn--ghost" @click="restart">重新回答</button>
          </div>
        </div>
      </div>
      <p class="wizard-result__note">推荐只基于你刚才的三个回答；配置器里还可以继续换版本、车漆和轮毂。</p>
    </div>

    <div v-else class="wizard">
      <div class="wizard__progress">
        <span v-for="(_, index) in questions" :key="index" class="wizard__dot" :class="{ 'wizard__dot--active': index <= step }"></span>
        <span class="wizard__count num">{{ step + 1 }} / 3</span>
      </div>

      <h2 class="wizard__title">{{ questions[step]?.title }}</h2>
      <p class="wizard__hint">{{ questions[step]?.hint }}</p>

      <div v-if="step === 0" class="wizard__options">
        <button v-for="item in budgets" :key="item.value" type="button" class="wizard__option" :class="{ 'wizard__option--active': budget === item.value }" @click="budget = item.value">
          <strong>{{ item.label }}</strong><span>{{ item.note }}</span>
        </button>
      </div>

      <div v-else-if="step === 1" class="wizard__options">
        <button v-for="item in usages" :key="item.value" type="button" class="wizard__option" :class="{ 'wizard__option--active': usage === item.value }" @click="usage = item.value">
          <strong>{{ item.label }}</strong><span>{{ item.note }}</span>
        </button>
      </div>

      <div v-else class="wizard__options">
        <button v-for="item in seatOptions" :key="item.value" type="button" class="wizard__option" :class="{ 'wizard__option--active': seats === item.value }" @click="seats = item.value">
          <strong>{{ item.label }}</strong><span>{{ item.note }}</span>
        </button>
      </div>

      <div class="wizard__actions">
        <button type="button" class="btn btn--ghost" :disabled="step === 0" @click="back">上一步</button>
        <button type="button" class="btn btn--primary" @click="next">{{ step === 2 ? "看看推荐" : "下一步" }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wizard {
  max-width: 760px;
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.wizard__progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: var(--space-5);
}

.wizard__dot {
  width: 28px;
  height: 2px;
  background: var(--line);
}

.wizard__dot--active {
  background: var(--accent);
}

.wizard__count {
  margin-left: auto;
  color: var(--muted);
  font-size: 11px;
}

.wizard__title {
  font-size: 28px;
}

.wizard__hint {
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: 13px;
}

.wizard__options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.wizard__option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  text-align: left;
  transition: border-color var(--duration-2) var(--ease), background var(--duration-2) var(--ease);
}

.wizard__option strong {
  font-size: 15px;
}

.wizard__option span {
  color: var(--muted);
  font-size: 12px;
}

.wizard__option:hover,
.wizard__option--active {
  border-color: var(--accent);
  background: rgba(215, 25, 32, 0.07);
}

.wizard__actions {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.wizard-state {
  padding: var(--space-6);
  color: var(--muted);
}

.wizard-result {
  max-width: 860px;
}

.wizard-result__title {
  margin-top: var(--space-2);
  font-size: 34px;
}

.wizard-result__reason {
  max-width: 56ch;
  margin-top: var(--space-3);
  color: var(--muted);
  font-size: 14px;
  line-height: 1.9;
}

.wizard-result__card {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: var(--space-5);
  margin-top: var(--space-5);
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.wizard-result__card img {
  width: 100%;
  height: 100%;
  min-height: 220px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.wizard-result__meta {
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: 13px;
}

.wizard-result__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.wizard-result__note {
  margin-top: var(--space-4);
  color: var(--muted);
  font-size: 11px;
}

@media (max-width: 720px) {
  .wizard__options,
  .wizard-result__card {
    grid-template-columns: 1fr;
  }

  .wizard-result__card img {
    min-height: 160px;
    max-height: 220px;
  }
}
</style>