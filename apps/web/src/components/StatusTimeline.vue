<script setup lang="ts">
import { computed } from "vue";
import type { OrderStatus } from "@wangshu/shared";
import { formatDateTime } from "../lib/format";

const props = defineProps<{
  status: OrderStatus;
  createdAt: string;
  paidAt: string | null;
}>();

const steps: { key: OrderStatus; label: string; hint: string }[] = [
  { key: "pending_payment", label: "待支付", hint: "订单已创建，等待支付定金" },
  { key: "paid", label: "已支付", hint: "定金支付成功" },
  { key: "confirmed", label: "已确认", hint: "门店确认订单" },
  { key: "delivered", label: "已交付", hint: "车辆交付完成" },
];

const activeIndex = computed(() => {
  const index = steps.findIndex((step) => step.key === props.status);
  return index >= 0 ? index : -1;
});
</script>

<template>
  <div class="timeline">
    <p v-if="status === 'cancelled'" class="timeline__cancelled" role="alert">
      该订单已取消，不再继续流转。
    </p>
    <ol v-else class="timeline__steps" aria-label="订单状态">
      <li
        v-for="(step, index) in steps"
        :key="step.key"
        class="timeline__step"
        :class="{
          'is-done': index <= activeIndex,
          'is-current': index === activeIndex,
          'is-todo': index > activeIndex,
        }"
      >
        <span class="timeline__dot" aria-hidden="true"></span>
        <div class="timeline__body">
          <p class="timeline__label">{{ step.label }}</p>
          <p class="timeline__hint">{{ step.hint }}</p>
          <p v-if="index === 0" class="timeline__time num">{{ formatDateTime(createdAt) }}</p>
          <p v-if="step.key === 'paid' && paidAt" class="timeline__time num">{{ formatDateTime(paidAt) }}</p>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.timeline__steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.timeline__step {
  position: relative;
  display: flex;
  gap: var(--space-4);
}

.timeline__step:not(:last-child)::before {
  content: "";
  position: absolute;
  left: 6px;
  top: 18px;
  bottom: calc(-1 * var(--space-5));
  width: 1px;
  background: var(--line);
}

.timeline__step.is-done:not(:last-child)::before {
  background: rgba(111, 207, 151, 0.4);
}

.timeline__dot {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  width: 13px;
  height: 13px;
  margin-top: 5px;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--surface);
}

.is-done .timeline__dot {
  border-color: var(--ok);
  background: var(--ok);
}

.is-current .timeline__dot {
  border-color: var(--accent);
  background: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

.is-todo .timeline__label,
.is-todo .timeline__hint {
  opacity: 0.55;
}

.timeline__label {
  font-size: 14px;
}

.timeline__hint {
  margin-top: 2px;
  font-size: 12px;
  color: var(--muted);
}

.timeline__time {
  margin-top: 4px;
  font-size: 11px;
  color: var(--muted);
}

.timeline__cancelled {
  padding: var(--space-4);
  border: 1px solid rgba(224, 108, 117, 0.4);
  border-radius: var(--radius-sm);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 13px;
}
</style>
