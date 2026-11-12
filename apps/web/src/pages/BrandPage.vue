<script setup lang="ts">
import { RouterLink } from "vue-router";
import { assetUrl } from "../lib/assets";

const principles = [
  { index: "01", title: "多源归一", text: "不同品牌的车系、版本、配置项和价格口径差异很大；平台先把它们归一成同一套字段，再允许跨品牌比较。" },
  { index: "02", title: "同口径报价", text: "裸车、购置税、保险、上牌、选装逐项列明；金额统一由服务端计算，前端只负责展示。" },
  { index: "03", title: "来源透明", text: "每张海报、每份价格都标注来源与更新时间；没有来源的数据不进入对比，不用 AI 图冒充官方实拍。" },
];

const numbers = [
  { value: "2", unit: "款", label: "当前演示车型" },
  { value: "1", unit: "个", label: "当前演示品牌" },
  { value: "4", unit: "家", label: "合作门店（演示）" },
  { value: "24", unit: "h", label: "试驾确认" },
];

const facts = [
  { label: "平台模式", value: "多品牌聚合 · 不自营" },
  { label: "当前收录", value: "比亚迪 1 品牌 / 2 款" },
  { label: "后续计划", value: "8–10 品牌 / 20+ 车型" },
  { label: "平台边界", value: "不替代官方销售渠道" },
];
</script>

<template>
  <div class="brand-page">
    <section class="brand-hero">
      <img :src="assetUrl('/images/han-hero.webp')" alt="演示车型海报：比亚迪汉 EV" class="brand-hero__image" />
      <div class="brand-hero__scrim" aria-hidden="true"></div>
      <div class="container brand-hero__inner">
        <p class="eyebrow">关于车鉴 · CarLens</p>
        <h1 class="brand-hero__title">多品牌的车，<br />放在一起讲清楚。</h1>
        <p class="brand-hero__lead">
          车鉴 CarLens 是毕业设计中的多品牌汽车配置聚合与在线报价平台：不隶属于任何车企，也不替代官方销售渠道。
          我们把车型、配置、报价、门店与试驾信息放在同一个入口，帮用户先看清，再做决定。
        </p>
      </div>
    </section>

    <div class="container brand-body">
      <section class="brand-section brand-about">
        <div class="brand-about__copy">
          <p class="eyebrow">我们是谁</p>
          <h2 class="section-title">一个聚合入口，而不是一家车厂</h2>
          <p class="brand-about__text">
            同一款车在不同品牌官网有不同的配置命名、选装规则和报价口径，用户很难横向比较。
            车鉴先做数据归一化，再把“车型—版本—配置—价格—来源”放到同一套结构里。
          </p>
          <p class="brand-about__text">
            当前演示数据以比亚迪公开车型与海报为样本；后续会扩展到蔚来、小鹏、理想、极氪、小米、问界等品牌。
            所有价格、门店与订单均为演示数据，支付为模拟网关。
          </p>
        </div>
        <div class="brand-about__facts">
          <div v-for="item in facts" :key="item.label" class="fact">
            <p class="fact__label">{{ item.label }}</p>
            <p class="fact__value">{{ item.value }}</p>
          </div>
        </div>
      </section>

      <section class="brand-section">
        <p class="eyebrow">我们怎么聚合</p>
        <h2 class="section-title">三条原则</h2>
        <div class="principle-grid">
          <article v-for="item in principles" :key="item.index" class="principle">
            <span class="principle__index num">{{ item.index }}</span>
            <h3 class="principle__title">{{ item.title }}</h3>
            <p class="principle__text">{{ item.text }}</p>
          </article>
        </div>
      </section>

      <section class="brand-section">
        <p class="eyebrow">数字</p>
        <h2 class="section-title">少一点，准一点</h2>
        <div class="number-grid">
          <div v-for="item in numbers" :key="item.label" class="number">
            <p class="number__value"><span class="num">{{ item.value }}</span><span class="number__unit">{{ item.unit }}</span></p>
            <p class="number__label">{{ item.label }}</p>
          </div>
        </div>
      </section>

      <section class="brand-section brand-section--cta">
        <div>
          <p class="eyebrow">开始</p>
          <h2 class="section-title">从一台车，到一份属于你的配置</h2>
        </div>
        <div class="brand-section__actions">
          <RouterLink to="/models" class="btn btn--primary">浏览车型</RouterLink>
          <RouterLink to="/test-drive" class="btn btn--ghost">预约试驾</RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.brand-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 620px;
  overflow: hidden;
  border-bottom: 1px solid var(--line);
}

.brand-hero__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 62% 66%;
}

.brand-hero__scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(7, 10, 14, 0.94) 0%, rgba(7, 10, 14, 0.74) 38%, rgba(7, 10, 14, 0.25) 68%, rgba(7, 10, 14, 0.08) 100%),
    linear-gradient(180deg, rgba(7, 10, 14, 0.4), transparent 42%, rgba(7, 10, 14, 0.72));
}

.brand-hero__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-block: var(--space-9);
  color: #fff;
}

.brand-hero__title {
  font-size: clamp(40px, 5.4vw, 66px);
}

.brand-hero__lead {
  max-width: 58ch;
  color: rgba(255, 255, 255, 0.78);
  font-size: 15px;
  line-height: 1.95;
}

.brand-body {
  padding-block: var(--space-8);
}

.brand-section {
  padding-block: var(--space-6);
  border-top: 1px solid var(--line);
}

.brand-about {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: var(--space-7);
  align-items: start;
}

.brand-about__copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.brand-about__text {
  max-width: 62ch;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.9;
}

.brand-about__facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--line);
}

.fact {
  min-height: 94px;
  padding: var(--space-4);
  background: var(--surface);
}

.fact__label {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
}

.fact__value {
  margin-top: var(--space-2);
  font-size: 14px;
  line-height: 1.6;
}

.principle-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-5);
}

.principle {
  padding: var(--space-5);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.principle__index {
  font-size: 11px;
  color: var(--accent);
}

.principle__title {
  margin-top: var(--space-3);
  font-size: 21px;
}

.principle__text {
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: 13px;
  line-height: 1.8;
}

.number-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-5);
}

.number {
  padding: var(--space-4);
  border-left: 1px solid var(--line);
}

.number__value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 34px;
}

.number__unit {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
}

.number__label {
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.06em;
}

.brand-section--cta {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.brand-section__actions {
  display: flex;
  gap: var(--space-3);
}

@media (max-width: 900px) {
  .brand-about {
    grid-template-columns: 1fr;
  }

  .principle-grid,
  .number-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .brand-hero {
    min-height: 560px;
  }

  .brand-about__facts,
  .principle-grid,
  .number-grid {
    grid-template-columns: 1fr;
  }
}
</style>