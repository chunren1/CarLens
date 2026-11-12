<script setup lang="ts">
import { RouterLink } from "vue-router";

const services = [
  { index: "01", title: "补能", text: "5C 超充 10 分钟补能 400 km；家充桩一站式安装；全国合作充电网络。" },
  { index: "02", title: "质保", text: "整车 6 年 / 15 万公里，三电 8 年 / 16 万公里；首任车主终身免费道路救援。" },
  { index: "03", title: "保养", text: "纯电平台无发动机、无变速箱；基础保养以检查与更换滤芯为主，价格透明。" },
  { index: "04", title: "救援", text: "7×24 小时道路救援；电量耗尽、爆胎、事故均可一键呼叫。" },
];

const steps = [
  { title: "线上预约", text: "在门店页选择城市与门店，预约试驾或交付。" },
  { title: "到店体验", text: "顾问只确认需求，不推销；配置与报价可在手机上完成。" },
  { title: "交付与售后", text: "统一价格、统一交付标准；售后由直营门店与授权服务中心承接。" },
];
</script>

<template>
  <div class="page container">
    <header class="page-head">
      <p class="eyebrow">车主服务</p>
      <h1 class="page-title">车卖出去之后，服务才开始</h1>
      <p class="page-sub">
        车鉴聚合多品牌车型与服务信息：页面展示为演示内容，具体权益以品牌官方与购车合同为准。
      </p>
    </header>

    <div class="service-grid">
      <article v-for="service in services" :key="service.index" class="service-card">
        <span class="service-card__index num">{{ service.index }}</span>
        <h2 class="service-card__title">{{ service.title }}</h2>
        <p class="service-card__text">{{ service.text }}</p>
      </article>
    </div>

    <section class="service-steps">
      <div class="section-head">
        <div>
          <p class="eyebrow">服务流程</p>
          <h2 class="section-title">三步，不绕弯</h2>
        </div>
      </div>
      <ol class="steps">
        <li v-for="(step, index) in steps" :key="step.title" class="step">
          <span class="step__index num">{{ String(index + 1).padStart(2, "0") }}</span>
          <h3 class="step__title">{{ step.title }}</h3>
          <p class="step__text">{{ step.text }}</p>
        </li>
      </ol>
    </section>

    <section class="service-cta">
      <div>
        <p class="eyebrow">下一步</p>
        <h2 class="section-title">先看一次实车，再谈服务</h2>
      </div>
      <div class="service-cta__actions">
        <RouterLink to="/test-drive" class="btn btn--primary">预约试驾</RouterLink>
        <RouterLink to="/stores" class="btn btn--ghost">门店查询</RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.service-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.service-card {
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.service-card__index {
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--accent);
}

.service-card__title {
  margin-top: var(--space-3);
  font-size: 26px;
}

.service-card__text {
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: 14px;
  line-height: 1.8;
}

.service-steps {
  margin-top: var(--space-8);
}

.steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.step {
  padding: var(--space-5);
  border-top: 1px solid var(--line);
}

.step__index {
  font-size: 11px;
  color: var(--accent-2);
}

.step__title {
  margin-top: var(--space-2);
  font-size: 20px;
}

.step__text {
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: 13px;
  line-height: 1.8;
}

.service-cta {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-8);
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, rgba(127, 166, 216, 0.08), transparent 60%);
}

.service-cta__actions {
  display: flex;
  gap: var(--space-3);
}

@media (max-width: 720px) {
  .service-grid,
  .steps {
    grid-template-columns: 1fr;
  }
}
</style>