<script setup lang="ts">
import { computed } from "vue";
import { useConfiguratorStore } from "../../stores/configurator";
import { money, priceSuffix } from "../../lib/format";

const store = useConfiguratorStore();

const rangeKm = computed(() => {
  if (store.quote) return store.quote.rangeKm;
  const trim = store.selectedTrim;
  if (!trim) return null;
  return trim.rangeKm + (store.selectedWheel?.rangeDelta ?? 0);
});
</script>

<template>
  <aside class="panel" aria-label="配置选项">
    <div class="panel__scroll">
      <section class="group">
        <header class="group__head">
          <h2 class="group__title">版本</h2>
          <span class="group__meta">{{ store.trims.length }} 选 1</span>
        </header>
        <div class="trims">
          <button
            v-for="trim in store.trims"
            :key="trim.id"
            type="button"
            class="trim"
            :class="{ 'trim--active': trim.id === store.trimId }"
            :aria-pressed="trim.id === store.trimId"
            @click="store.selectTrim(trim.id)"
          >
            <span class="trim__top">
              <span class="trim__name">{{ trim.name }}</span>
              <span class="trim__price num">{{ money(trim.price) }}</span>
            </span>
            <span class="trim__specs num">
              {{ trim.rangeKm }} km · {{ trim.zero100 }} s · {{ trim.powerKw }} kW
            </span>
          </button>
        </div>
      </section>

      <section class="group">
        <header class="group__head">
          <h2 class="group__title">车漆</h2>
          <span class="group__meta">{{ store.selectedPaint?.name ?? "—" }}</span>
        </header>
        <div class="swatches">
          <button
            v-for="paint in store.paints"
            :key="paint.id"
            type="button"
            class="swatch"
            :class="{ 'swatch--active': paint.id === store.paintId }"
            :aria-pressed="paint.id === store.paintId"
            :aria-label="paint.name + '，' + priceSuffix(paint.price)"
            @click="store.selectPaint(paint.id)"
          >
            <span class="swatch__dot" :style="{ background: paint.hex }" aria-hidden="true"></span>
            <span class="swatch__text">
              <span class="swatch__name">{{ paint.name }}</span>
              <span class="swatch__price num">{{ priceSuffix(paint.price) }}</span>
            </span>
          </button>
        </div>
      </section>

      <section class="group">
        <header class="group__head">
          <h2 class="group__title">轮毂</h2>
          <span v-if="rangeKm !== null" class="group__meta">续航 {{ rangeKm }} km</span>
        </header>
        <div class="wheels">
          <button
            v-for="wheel in store.wheels"
            :key="wheel.id"
            type="button"
            class="wheel"
            :class="{ 'wheel--active': wheel.id === store.wheelId }"
            :aria-pressed="wheel.id === store.wheelId"
            @click="store.selectWheel(wheel.id)"
          >
            <span class="wheel__disc" aria-hidden="true"></span>
            <span class="wheel__text">
              <span class="wheel__name">{{ wheel.name }}</span>
              <span class="wheel__meta">
                {{ wheel.sizeInch }} 英寸
                <template v-if="wheel.rangeDelta !== 0">
                  · 续航 {{ wheel.rangeDelta > 0 ? "+" : "" }}{{ wheel.rangeDelta }} km
                </template>
              </span>
            </span>
            <span class="wheel__price num">{{ priceSuffix(wheel.price) }}</span>
          </button>
        </div>
      </section>

      <section class="group">
        <header class="group__head">
          <h2 class="group__title">内饰</h2>
          <span class="group__meta">{{ store.selectedInterior?.name ?? "—" }}</span>
        </header>
        <div class="swatches">
          <button
            v-for="interior in store.interiors"
            :key="interior.id"
            type="button"
            class="swatch"
            :class="{ 'swatch--active': interior.id === store.interiorId }"
            :aria-pressed="interior.id === store.interiorId"
            :aria-label="interior.name + '，' + priceSuffix(interior.price)"
            @click="store.selectInterior(interior.id)"
          >
            <span class="swatch__dot" :style="{ background: interior.hex }" aria-hidden="true"></span>
            <span class="swatch__text">
              <span class="swatch__name">{{ interior.name }}</span>
              <span class="swatch__price num">{{ priceSuffix(interior.price) }}</span>
            </span>
          </button>
        </div>
      </section>

      <section class="group">
        <header class="group__head">
          <h2 class="group__title">选装</h2>
          <span class="group__meta">可多选</span>
        </header>
        <label v-for="item in store.packages" :key="item.id" class="option">
          <input
            class="option__input"
            type="checkbox"
            :checked="store.packageIds.includes(item.id)"
            @change="store.togglePackage(item.id)"
          />
          <span class="option__box" aria-hidden="true"></span>
          <span class="option__text">
            <span class="option__name">{{ item.name }}</span>
            <span class="option__desc">{{ item.description }}</span>
          </span>
          <span class="option__price num">{{ priceSuffix(item.price) }}</span>
        </label>
        <p v-if="store.packages.length === 0" class="panel__empty">该车型暂无可选选装包。</p>
      </section>
    </div>

    <div v-if="store.quoteError" class="panel__conflict" role="alert">
      <span class="panel__conflict-icon" aria-hidden="true">!</span>
      <div>
        <p class="panel__conflict-title">当前组合不可选</p>
        <p class="panel__conflict-text">{{ store.quoteError }}</p>
      </div>
    </div>
    <div v-else-if="store.quoteState === 'loading'" class="panel__pending" role="status">
      <span class="panel__pending-dot" aria-hidden="true"></span>
      正在重新计算价格…
    </div>
  </aside>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
  max-height: min(760px, calc(100vh - 220px));
}

.panel__scroll {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  scrollbar-width: thin;
}

.group {
  padding: var(--space-4) var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--line);
}

.group:last-child {
  border-bottom: 0;
}

.group__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.group__title {
  font-family: var(--font-display);
  font-size: 16px;
  letter-spacing: 0.08em;
}

.group__meta {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.trims {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.trim {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  text-align: left;
  transition: border-color var(--duration-2) var(--ease), background var(--duration-2) var(--ease);
}

.trim:hover {
  border-color: rgba(78, 177, 221, 0.4);
}

.trim--active {
  border-color: var(--accent);
  background: rgba(78, 177, 221, 0.08);
}

.trim__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}

.trim__name {
  font-size: 14px;
}

.trim__price {
  font-size: 13px;
  color: var(--text);
}

.trim--active .trim__name {
  color: var(--accent);
}

.trim__specs {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.02em;
}

.swatches {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.swatch {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  text-align: left;
  transition: border-color var(--duration-2) var(--ease);
}

.swatch:hover {
  border-color: rgba(127, 166, 216, 0.5);
}

.swatch--active {
  border-color: var(--accent);
  background: rgba(78, 177, 221, 0.08);
}

.swatch__dot {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  border: 1px solid rgba(237, 242, 248, 0.22);
  border-radius: 50%;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.18);
}

.swatch__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.swatch__name {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.swatch__price {
  font-size: 10px;
  color: var(--muted);
}

.wheels {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.wheel {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  text-align: left;
  transition: border-color var(--duration-2) var(--ease);
}

.wheel:hover {
  border-color: rgba(127, 166, 216, 0.5);
}

.wheel--active {
  border-color: var(--accent);
  background: rgba(78, 177, 221, 0.08);
}

.wheel__disc {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  border: 1px solid var(--line);
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 50%, #0a0d12 0 32%, #4a5058 32% 38%, #0a0d12 38% 60%, #4a5058 60% 65%, #0a0d12 65%);
}

.wheel--active .wheel__disc {
  border-color: var(--accent);
}

.wheel__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.wheel__name {
  font-size: 12px;
}

.wheel__meta {
  font-size: 10px;
  color: var(--muted);
}

.wheel__price {
  margin-left: auto;
  font-size: 11px;
  color: var(--muted);
  white-space: nowrap;
}

.wheel--active .wheel__price {
  color: var(--accent);
}

.option {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--duration-2) var(--ease);
}

.option:hover {
  background: var(--surface-2);
}

.option__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.option__box {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin-top: 3px;
  border: 1px solid var(--line);
  border-radius: var(--radius-xs);
  background: var(--surface-2);
  transition: border-color var(--duration-2) var(--ease), background var(--duration-2) var(--ease);
}

.option__input:checked + .option__box {
  border-color: var(--accent);
  background: var(--accent);
  box-shadow: inset 0 0 0 3px var(--surface-2);
}

.option__input:focus-visible + .option__box {
  outline: 2px solid var(--accent-2);
  outline-offset: 2px;
}

.option__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.option__name {
  font-size: 13px;
}

.option__desc {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.5;
}

.option__price {
  margin-left: auto;
  font-size: 11px;
  color: var(--muted);
  white-space: nowrap;
}

.panel__empty {
  padding: 10px;
  font-size: 12px;
  color: var(--muted);
}

.panel__conflict {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid rgba(224, 108, 117, 0.4);
  background: var(--danger-soft);
}

.panel__conflict-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  border: 1px solid rgba(224, 108, 117, 0.6);
  border-radius: 50%;
  color: var(--danger);
  font-family: var(--font-mono);
  font-size: 11px;
}

.panel__conflict-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--danger);
}

.panel__conflict-text {
  margin-top: 2px;
  font-size: 12px;
  color: #e8a6ac;
  line-height: 1.5;
}

.panel__pending {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 12px;
}

.panel__pending-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-2);
  animation: pulse 1.1s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.85);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@media (max-width: 1024px) {
  .panel {
    max-height: none;
  }

  .panel__scroll {
    overflow-y: visible;
  }
}

@media (max-width: 640px) {
  .swatches {
    grid-template-columns: 1fr 1fr;
  }
}
</style>