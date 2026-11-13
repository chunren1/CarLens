<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useConfiguratorStore } from "../stores/configurator";
import OptionPanel from "../components/configurator/OptionPanel.vue";
import PriceBar from "../components/configurator/PriceBar.vue";
import StateBlock from "../components/StateBlock.vue";
import { saveConfigSnapshot } from "../lib/config-snapshot";
import { money } from "../lib/format";
import { assetUrl } from "../lib/assets";
import { wheelFinishFor } from "../lib/wheel-finish";

/** 全系共用同一个四门轿车 3D 示意模型，封面/车型卡仍用高清海报。 */
const Configurator3D = defineAsyncComponent(() => import("../components/Configurator3D.vue"));
const SHARED_3D_MODEL = "s7";
type DisplayMode = "3d" | "2d";
const DISPLAY_MODE_KEY = "wangshu.configurator.display";

const route = useRoute();
const router = useRouter();
const store = useConfiguratorStore();

const slug = computed(() => String(route.params.slug ?? ""));
const modelName = computed(() => store.catalog?.model.name ?? "车鉴");
const heroImage = computed(() => assetUrl(store.catalog?.model.heroImage ?? "/images/seal-hero.webp"));
const PAINT_IMAGE_VERSION = "20261113-v4";
const paintImage = computed(() => {
  const image = store.selectedPaint?.image;
  if (!image) return heroImage.value;
  const base = assetUrl(image);
  return base + (base.includes("?") ? "&" : "?") + "v=" + PAINT_IMAGE_VERSION;
});

function readDisplayMode(): DisplayMode {
  try {
    return localStorage.getItem(DISPLAY_MODE_KEY) === "2d" ? "2d" : "3d";
  } catch {
    return "3d";
  }
}

const displayMode = ref<DisplayMode>(readDisplayMode());
const stageReady = ref(false);
const stageProgress = ref(0);
const stageError = ref("");
const view = ref<"front" | "side" | "rear">("side");
const views = [
  { id: "front" as const, label: "前 45°" },
  { id: "side" as const, label: "侧面" },
  { id: "rear" as const, label: "后 45°" },
];

const paintHex = computed(() => store.selectedPaint?.hex ?? "#8a0f14");
const wheelFinish = computed(() => {
  const index = store.wheels.findIndex((wheel) => wheel.id === store.wheelId);
  const wheel = index >= 0 ? store.wheels[index] : undefined;
  return wheelFinishFor(wheel?.name ?? "", index);
});

const notice = ref("");
let noticeTimer: ReturnType<typeof setTimeout> | null = null;

function flash(message: string): void {
  notice.value = message;
  if (noticeTimer !== null) clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    notice.value = "";
    noticeTimer = null;
  }, 2600);
}

function readInitialTrim(): number | undefined {
  const raw = route.query.trim;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : undefined;
}

function load(slugValue: string): void {
  // 3D 只在 3D 模式下加载；2D 模式不请求 three.js 与 GLB。
  stageReady.value = false;
  stageProgress.value = 0;
  stageError.value = "";
  void store.loadCatalog(slugValue, readInitialTrim());
}

function setDisplayMode(mode: DisplayMode): void {
  if (displayMode.value === mode) return;
  displayMode.value = mode;
  stageReady.value = false;
  stageProgress.value = 0;
  stageError.value = "";
  try {
    localStorage.setItem(DISPLAY_MODE_KEY, mode);
  } catch {
    // 隐私模式下 localStorage 不可用，仅本次生效。
  }
}

function handleStageReady(): void {
  stageReady.value = true;
  stageError.value = "";
}

function handleStageProgress(percent: number): void {
  stageProgress.value = percent;
}

function handleStageError(message: string): void {
  stageError.value = message;
  stageReady.value = false;
}

onMounted(() => {
  load(slug.value);
});

watch(slug, (next) => {
  load(next);
});

onBeforeUnmount(() => {
  store.cancelPendingQuote();
  if (noticeTimer !== null) clearTimeout(noticeTimer);
});

function persist(): boolean {
  const quote = store.quote;
  const input = store.input;
  if (!quote || !input) return false;
  try {
    saveConfigSnapshot({
      version: 1,
      savedAt: new Date().toISOString(),
      input,
      quote,
    });
    return true;
  } catch {
    flash("浏览器本地存储不可用，配置未能保存");
    return false;
  }
}

function handleSave(): void {
  if (persist()) flash("配置已保存到本机，可在报价单继续");
}

function handleQuote(): void {
  if (persist()) void router.push({ name: "quote" });
}

function handleOrder(): void {
  if (persist()) void router.push({ name: "order-new" });
}
</script>

<template>
  <div class="configurator">
    <h1 class="sr-only">{{ modelName }} 配置器</h1>
    <div class="container configurator__head">
      <nav class="crumbs" aria-label="面包屑">
        <RouterLink to="/models" class="crumbs__link">车型</RouterLink>
        <span class="crumbs__sep" aria-hidden="true">/</span>
        <RouterLink
          v-if="store.catalog"
          :to="{ name: 'model', params: { slug } }"
          class="crumbs__link"
        >
          {{ modelName }}
        </RouterLink>
        <span class="crumbs__sep" aria-hidden="true">/</span>
        <span class="crumbs__current">配置器</span>
      </nav>
      <p class="configurator__total">
        <span class="configurator__total-label">已选落地价</span>
        <span class="num configurator__total-value">
          {{ store.quote ? money(store.quote.total) : "—" }}
        </span>
      </p>
    </div>

    <div v-if="store.catalogState === 'ready'" class="container configurator__body">
      <section class="stage-frame">
        <img
          class="stage-photo"
          :class="{ 'stage-photo--hidden': displayMode === '3d' && stageReady }"
          :src="paintImage"
          :alt="modelName + ' 高清海报'"
        />
        <div
          class="stage-frame__shade"
          :class="{ 'stage-frame__shade--hidden': displayMode === '3d' && stageReady }"
          aria-hidden="true"
        ></div>

        <div v-if="displayMode === '3d' && !stageError" class="stage-3d">
          <Configurator3D
            :model-slug="SHARED_3D_MODEL"
            :paint-hex="paintHex"
            :wheel-finish="wheelFinish"
            :view="view"
            @ready="handleStageReady"
            @progress="handleStageProgress"
            @error="handleStageError"
          />
        </div>

        <div v-if="displayMode === '3d' && !stageReady && !stageError" class="stage-loader" role="status">
          <span class="stage-loader__spinner" aria-hidden="true"></span>
          <span>正在布置 3D 展示</span>
          <span class="num">{{ stageProgress }}%</span>
          <span class="stage-loader__poster">封面海报先顶上</span>
        </div>

        <p v-if="displayMode === '3d' && stageError" class="stage-fallback" role="status">3D 加载失败，已切换为高清海报</p>

        <div class="stage-frame__plate">
          <p class="stage-frame__en">{{ store.catalog?.model.enName }}</p>
          <p class="stage-frame__name">{{ modelName }}</p>
          <p class="stage-frame__sub">
            {{ store.selectedTrim?.name ?? "—" }} · {{ store.selectedPaint?.name ?? "—" }}
          </p>
        </div>

        <div class="stage-modes" role="group" aria-label="展示方式">
          <button
            type="button"
            class="stage-modes__btn"
            :class="{ 'stage-modes__btn--active': displayMode === '3d' }"
            :aria-pressed="displayMode === '3d'"
            @click="setDisplayMode('3d')"
          >
            3D 示意
          </button>
          <button
            type="button"
            class="stage-modes__btn"
            :class="{ 'stage-modes__btn--active': displayMode === '2d' }"
            :aria-pressed="displayMode === '2d'"
            @click="setDisplayMode('2d')"
          >
            2D 海报
          </button>
        </div>
        <div v-if="displayMode === '3d' && !stageError" class="stage-views" role="group" aria-label="3D 视角">
          <button
            v-for="item in views"
            :key="item.id"
            type="button"
            class="stage-views__btn"
            :class="{ 'stage-views__btn--active': view === item.id }"
            :aria-pressed="view === item.id"
            @click="view = item.id"
          >
            {{ item.label }}
          </button>
        </div>
        <p class="stage-frame__hint">
          {{ displayMode === "3d"
            ? "全系共用四门轿车 3D 示意模型 · 车漆 / 轮毂实时联动"
            : "2D 高清海报 · 车漆 / 轮毂选项仍会联动价格" }}
        </p>
      </section>

      <p class="stage-note">
        {{ displayMode === "3d"
          ? "全系共用四门轿车 3D 示意模型 · 车漆 / 轮毂实时联动 · 封面以高清海报为准"
          : "当前为 2D 高清海报模式 · 可切回 3D 示意 · 配置与价格不受影响" }}
      </p>

      <OptionPanel />
    </div>

    <StateBlock
      v-else
      class="configurator__state"
      :state="store.catalogState === 'error' ? 'error' : 'loading'"
      :error="store.catalogError"
      loading-text="正在加载配置选项…"
      @retry="load(slug)"
    />

    <PriceBar
      v-if="store.catalogState === 'ready'"
      :quote="store.quote"
      :quote-state="store.quoteState"
      :error="store.quoteError"
      @save="handleSave"
      @quote="handleQuote"
      @order="handleOrder"
    />

    <p v-if="notice" class="toast" role="status">{{ notice }}</p>
  </div>
</template>

<style scoped>
.configurator {
  padding-block: var(--space-5) 150px;
}

.configurator__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.crumbs {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.crumbs__link:hover {
  color: var(--accent);
}

.crumbs__current {
  color: var(--text);
}

.configurator__total {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.configurator__total-label {
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.configurator__total-value {
  font-size: 18px;
  color: var(--accent);
}

.configurator__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: var(--space-4);
  align-items: start;
}

.stage-frame {
  position: relative;
  aspect-ratio: 4 / 3;
  min-height: 420px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: #fff;
}

.stage-photo {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 55%;
  transition: opacity 300ms var(--ease);
}

.stage-photo--hidden {
  opacity: 0;
}

.stage-3d {
  position: absolute;
  inset: 0;
  z-index: 2;
}

.stage-loader {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(8, 11, 15, 0.62);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-align: center;
}

.stage-loader__spinner {
  width: 26px;
  height: 26px;
  border: 2px solid rgba(255, 255, 255, 0.28);
  border-top-color: #fff;
  border-radius: 50%;
  animation: stage-spin 900ms linear infinite;
}

.stage-loader__poster {
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
}

.stage-fallback {
  position: absolute;
  left: 50%;
  bottom: 16px;
  z-index: 4;
  transform: translateX(-50%);
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: var(--radius-pill);
  color: rgba(255, 255, 255, 0.8);
  background: rgba(8, 11, 15, 0.64);
  font-size: 10px;
  white-space: nowrap;
}

@keyframes stage-spin {
  to {
    transform: rotate(360deg);
  }
}

.stage-modes {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  z-index: 5;
  display: flex;
  gap: 3px;
  padding: 3px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: var(--radius-pill);
  background: rgba(8, 11, 15, 0.56);
  backdrop-filter: blur(8px);
}

.stage-modes__btn {
  padding: 5px 10px;
  border-radius: var(--radius-pill);
  color: rgba(255, 255, 255, 0.66);
  font-size: 10px;
  letter-spacing: 0.02em;
}

.stage-modes__btn:hover,
.stage-modes__btn--active {
  background: #fff;
  color: var(--text);
}

.stage-views {
  position: absolute;
  top: 58px;
  right: var(--space-3);
  z-index: 5;
  display: flex;
  gap: 3px;
  padding: 3px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-pill);
  background: rgba(8, 11, 15, 0.54);
  backdrop-filter: blur(8px);
}

.stage-views__btn {
  padding: 4px 8px;
  border-radius: var(--radius-pill);
  color: rgba(255, 255, 255, 0.62);
  font-size: 9px;
  letter-spacing: 0.02em;
}

.stage-views__btn:hover,
.stage-views__btn--active {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.stage-frame__shade {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  transition: opacity 300ms var(--ease);
  background:
    linear-gradient(180deg, rgba(8, 11, 15, 0.34), transparent 36%, transparent 62%, rgba(8, 11, 15, 0.72)),
    linear-gradient(90deg, rgba(8, 11, 15, 0.22), transparent 55%);
}

.stage-frame__plate {
  position: absolute;
  top: var(--space-5);
  left: var(--space-5);
  z-index: 5;
  color: #fff;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.55);
}

.stage-frame__en {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.26em;
  color: rgba(255, 255, 255, 0.72);
}

.stage-frame__name {
  margin-top: var(--space-1);
  font-family: var(--font-display);
  font-size: 26px;
  letter-spacing: 0.06em;
}

.stage-frame__sub {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}

.stage-frame__tag {
  position: absolute;
  top: var(--space-5);
  right: var(--space-5);
  z-index: 5;
  padding: 4px 10px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: var(--radius-pill);
  color: rgba(255, 255, 255, 0.82);
  font-size: 10px;
  letter-spacing: 0.08em;
}

.stage-frame__hint {
  position: absolute;
  left: var(--space-5);
  bottom: var(--space-4);
  z-index: 5;
  color: rgba(255, 255, 255, 0.66);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
}

.stage-frame__shade--hidden {
  opacity: 0;
}

.stage-note {
  display: none;
}

.configurator__state {
  margin-top: var(--space-4);
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 128px;
  z-index: 60;
  transform: translateX(-50%);
  padding: 10px 20px;
  border: 1px solid rgba(78, 177, 221, 0.35);
  border-radius: var(--radius-pill);
  background: rgba(17, 21, 26, 0.92);
  color: #fff;
  font-size: 13px;
  box-shadow: var(--shadow-1);
}

@media (max-width: 1024px) {
  .configurator__body {
    grid-template-columns: 1fr;
  }

  .stage-frame {
    min-height: 0;
  }
}

@media (max-width: 640px) {
  .stage-frame {
    aspect-ratio: auto;
    height: 360px;
  }

  .configurator {
    padding-block: var(--space-4) 200px;
  }

  .configurator__head {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .stage-frame__plate {
    top: var(--space-4);
    left: var(--space-4);
  }

  .stage-frame__name {
    font-size: 21px;
  }

  .stage-frame__hint {
    display: none;
  }

  .stage-note {
    display: block;
    margin-top: 10px;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 9px;
    line-height: 1.6;
  }

  .toast {
    bottom: 186px;
  }
}
</style>