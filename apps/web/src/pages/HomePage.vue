<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from "vue";
import { RouterLink } from "vue-router";
import type { ModelSummary } from "@wangshu/shared";
import HeroCarousel from "../components/HeroCarousel.vue";
import ModelCard from "../components/ModelCard.vue";
import StateBlock from "../components/StateBlock.vue";
import { api, errorMessage } from "../lib/api";
import { assetUrl } from "../lib/assets";

const models = shallowRef<ModelSummary[]>([]);
const state = ref<"loading" | "ready" | "error" | "empty">("loading");
const error = ref("");

async function loadModels(): Promise<void> {
  state.value = "loading";
  error.value = "";
  try {
    const list = await api.listModels();
    models.value = list;
    state.value = list.length > 0 ? "ready" : "empty";
  } catch (err) {
    error.value = errorMessage(err);
    state.value = "error";
  }
}

onMounted(() => {
  void loadModels();
});

const activeSlug = ref("r1");

const statsByModel = {
  r1: [
    { value: "650", unit: "km", label: "海豹 CLTC 续航" },
    { value: "3.8", unit: "s", label: "海豹 0–100 km/h" },
    { value: "19", unit: "英寸", label: "低风阻轮毂" },
  ],
  s7: [
    { value: "701", unit: "km", label: "汉 EV CLTC 续航" },
    { value: "7.9", unit: "s", label: "汉 EV 0–100 km/h" },
    { value: "19", unit: "英寸", label: "低风阻轮毂" },
  ],
} as const;

const numbers = computed(() => statsByModel[activeSlug.value as keyof typeof statsByModel] ?? statsByModel.r1);

const steps = [
  { index: "01", title: "选车", text: "海豹四门轿跑、汉 EV 旗舰轿车，均为纯电平台。" },
  { index: "02", title: "配置", text: "版本、车漆、轮毂、选装，高清车型图与价格实时联动。" },
  { index: "03", title: "下订", text: "透明报价单、模拟支付定金、订单状态可查。" },
];

const techs = [
  { value: "800V", title: "高压平台", text: "e 平台 3.0 Evo，800V 高压架构，为超充留足余量。" },
  { value: "5C", title: "超充倍率", text: "10 分钟补能 400 km。在服务区喝一杯咖啡的时间。" },
  { value: "3.8s", title: "零百加速", text: "海豹四驱性能版，双电机四驱，3.8 秒破百。" },
  { value: "701km", title: "CLTC 续航", text: "汉 EV 旗舰型 701 km；日常通勤一周一充。" },
];

const services = [
  { index: "01", title: "门店查询", text: "广州、深圳、上海直营门店，统一价格与交付标准。", to: "/stores" },
  { index: "02", title: "预约试驾", text: "不收费、不推销，顾问先确认时间再联系。", to: "/test-drive" },
  { index: "03", title: "金融方案", text: "首付、期限、月供即时测算，不被话术绕晕。", to: "/finance" },
];

const posterTeasers = [
  { file: "/images/brands/tesla-model3.webp", title: "特斯拉 Model 3", tag: "轿车" },
  { file: "/images/brands/xpeng-p7.webp", title: "小鹏 P7+", tag: "轿车" },
  { file: "/images/brands/xiaomi-su7.webp", title: "小米 SU7", tag: "轿车" },
];

const news = [
  { date: "11.12", tag: "产品", title: "海豹配置器上线：五套车漆与 21 英寸轮毂", text: "从版本到选装，价格由服务端实时计算，违规组合直接提示。" },
  { date: "11.08", tag: "服务", title: "首批四家直营门店开放试驾预约", text: "广州、深圳、上海四家车鉴合作门店开放预约。" },
  { date: "10.30", tag: "品牌", title: "为什么我们把展厅做成白色", text: "白色不是留白，而是让车的比例和颜色成为主角。" },
];
</script>

<template>
  <div class="home">
    <HeroCarousel :models="models" @change="activeSlug = $event" />

    <section class="numbers-band" aria-label="关键参数">
      <div class="container numbers">
        <div v-for="item in numbers" :key="item.label" class="numbers__item">
          <p class="numbers__value">
            <span class="num">{{ item.value }}</span>
            <span class="numbers__unit">{{ item.unit }}</span>
          </p>
          <p class="numbers__label">{{ item.label }}</p>
        </div>
      </div>
    </section>

    <section class="section container">
      <div class="section-head">
        <div>
          <p class="eyebrow">车型</p>
          <h2 class="section-title">两台车，两种性格</h2>
        </div>
        <RouterLink to="/models" class="more-link">全部车型 <span aria-hidden="true">→</span></RouterLink>
      </div>

      <StateBlock
        :state="state"
        :error="error"
        loading-text="正在读取车型…"
        empty-title="暂无在售车型"
        empty-text="车型正在更新，请稍后再来。"
        @retry="loadModels"
      >
        <div class="model-grid">
          <ModelCard v-for="model in models" :key="model.id" :model="model" />
        </div>
      </StateBlock>
    </section>

    <section class="poster-band">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">光影 · 海报</p>
            <h2 class="section-title">把车，做成一张海报。</h2>
          </div>
          <RouterLink to="/posters" class="more-link">全部海报 <span aria-hidden="true">→</span></RouterLink>
        </div>
        <div class="poster-strip">
          <RouterLink v-for="poster in posterTeasers" :key="poster.file" to="/posters" class="poster-teaser">
            <img :src="assetUrl(poster.file)" :alt="poster.title + ' 官方海报'" loading="lazy" />
            <span class="poster-teaser__meta">
              <strong>{{ poster.title }}</strong>
              <small>{{ poster.tag }}</small>
            </span>
          </RouterLink>
        </div>
      </div>
    </section>

    <section id="tech" class="section container tech-section">
      <div class="section-head">
        <div>
          <p class="eyebrow">核心技术</p>
          <h2 class="section-title">把复杂，藏在简单后面</h2>
        </div>
        <p class="section-sub muted">800V 平台、5C 超充、双电机四驱；参数不是全部，但先把底线说清楚。</p>
      </div>
      <div class="tech-grid">
        <article v-for="tech in techs" :key="tech.title" class="tech-card">
          <p class="tech-card__value num">{{ tech.value }}</p>
          <h3 class="tech-card__title">{{ tech.title }}</h3>
          <p class="tech-card__text">{{ tech.text }}</p>
        </article>
      </div>
    </section>

    <section class="steps-band">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">购车流程</p>
            <h2 class="section-title">三步，把这台车变成你的</h2>
          </div>
          <p class="section-sub muted">金额由服务端按配置实时计算；定金支付为模拟网关，不产生真实扣款。</p>
        </div>
        <ol class="steps">
          <li v-for="step in steps" :key="step.index" class="step">
            <span class="step__index num">{{ step.index }}</span>
            <h3 class="step__title">{{ step.title }}</h3>
            <p class="step__text">{{ step.text }}</p>
          </li>
        </ol>
        <div class="steps__cta">
          <RouterLink to="/models" class="btn btn--primary btn--lg">开始选车</RouterLink>
          <RouterLink to="/wizard" class="steps__wizard-link">不知道怎么选？让向导帮你 →</RouterLink>
        </div>
      </div>
    </section>

    <section class="section container service-section">
      <div class="section-head">
        <div>
          <p class="eyebrow">服务</p>
          <h2 class="section-title">买车之后，才是开始</h2>
        </div>
        <RouterLink to="/service" class="more-link">全部服务 <span aria-hidden="true">→</span></RouterLink>
      </div>
      <div class="service-grid">
        <RouterLink v-for="item in services" :key="item.index" :to="item.to" class="service-card">
          <span class="service-card__index num">{{ item.index }}</span>
          <h3 class="service-card__title">{{ item.title }}</h3>
          <p class="service-card__text">{{ item.text }}</p>
          <span class="service-card__arrow" aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </section>

    <section class="section container news-section">
      <div class="section-head">
        <div>
          <p class="eyebrow">新闻</p>
          <h2 class="section-title">车市，最近在做什么</h2>
        </div>
        <RouterLink to="/news" class="more-link">全部新闻 <span aria-hidden="true">→</span></RouterLink>
      </div>
      <div class="news-grid">
        <RouterLink v-for="item in news" :key="item.title" to="/news" class="news-card">
          <p class="news-card__meta"><span class="num">{{ item.date }}</span><span>{{ item.tag }}</span></p>
          <h3 class="news-card__title">{{ item.title }}</h3>
          <p class="news-card__text">{{ item.text }}</p>
        </RouterLink>
      </div>
    </section>

    <section class="cta-band">
      <div class="container cta-band__inner">
        <div>
          <p class="eyebrow">现在</p>
          <h2 class="cta-band__title">把好车，开回家。</h2>
          <p class="cta-band__text">先配置一台属于你的车，或者去最近的合作门店看一次实车。</p>
        </div>
        <div class="cta-band__actions">
          <RouterLink to="/brand" class="btn btn--primary btn--lg">了解我们</RouterLink>
          <RouterLink to="/test-drive" class="btn btn--ghost btn--lg">预约试驾</RouterLink>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.hero {
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  min-height: min(760px, calc(100vh - var(--header-height)));
  border-bottom: 1px solid var(--line);
}

.hero__media {
  position: absolute;
  inset: 0;
}

.hero__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 62% 68%;
  filter: saturate(0.92) contrast(1.04);
}

.hero__scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(7, 9, 12, 0.98) 0%, rgba(7, 9, 12, 0.94) 24%, rgba(7, 9, 12, 0.79) 38%, rgba(7, 9, 12, 0.52) 52%, rgba(7, 9, 12, 0.24) 68%, rgba(7, 9, 12, 0.08) 100%),
    linear-gradient(180deg, rgba(7, 9, 12, 0.55) 0%, transparent 30%, rgba(7, 9, 12, 0.62) 100%);
}

.hero__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-5);
  padding-block: var(--space-9);
}

.hero__title {
  max-width: 16ch;
  font-size: clamp(42px, 5.8vw, 70px);
  line-height: 1.1;
  letter-spacing: 0.03em;
  text-shadow: 0 2px 40px rgba(0, 0, 0, 0.65);
}

.hero__lead {
  max-width: 34ch;
  color: #b9c3cf;
  font-size: 16px;
  line-height: 1.9;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.hero__scroll {
  position: absolute;
  right: var(--space-6);
  bottom: var(--space-6);
  z-index: 1;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.34em;
  color: rgba(237, 242, 248, 0.42);
  writing-mode: vertical-rl;
}

.numbers-band {
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}

.numbers {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.numbers__item {
  padding: var(--space-6) var(--space-5);
  border-left: 1px solid var(--line);
}

.numbers__item:first-child {
  padding-left: 0;
  border-left: 0;
}

.numbers__value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: clamp(28px, 3.6vw, 44px);
  color: var(--text);
}

.numbers__unit {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.numbers__label {
  margin-top: var(--space-2);
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--muted);
}

.more-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--accent-2);
  transition: gap var(--duration-2) var(--ease);
}

.more-link:hover {
  gap: var(--space-3);
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-5);
}

.steps-band {
  padding-block: var(--space-8);
  border-top: 1px solid var(--line);
  background: #f1f3f6;
}

.section-sub {
  max-width: 46ch;
  font-size: 13px;
}

.steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--line);
}

.step {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5);
  background: var(--surface);
}

.step__index {
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--accent);
}

.step__title {
  font-size: 22px;
}

.step__text {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.8;
}

.steps__wizard-link {
  margin-left: var(--space-4);
  color: var(--muted);
  font-size: 13px;
}

.steps__wizard-link:hover {
  color: var(--accent);
}

.steps__cta {
  display: flex;
  justify-content: center;
  margin-top: var(--space-6);
}

@media (max-width: 1024px) {
  .hero__inner {
    padding-block: var(--space-8);
  }

  .model-grid {
    gap: var(--space-4);
  }
}

@media (max-width: 720px) {
  .hero {
    flex-direction: column-reverse;
    align-items: stretch;
    min-height: auto;
  }

  .hero__media {
    position: relative;
    inset: auto;
    width: 100%;
    aspect-ratio: 16 / 10;
    overflow: hidden;
  }

  .hero__media::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(7, 9, 12, 0.8) 0%, transparent 26%, transparent 72%, rgba(7, 9, 12, 0.7) 100%);
  }

  .hero__media img {
    object-position: 58% 68%;
  }

  .hero__scrim {
    display: none;
  }

  .hero__inner {
    padding-block: var(--space-6) var(--space-3);
  }

  .hero__scroll {
    display: none;
  }

  .model-grid {
    grid-template-columns: 1fr;
  }

  .steps {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .numbers__item {
    padding: var(--space-4) var(--space-3);
  }

  .numbers__item:first-child {
    padding-left: 0;
  }

  .numbers__value {
    font-size: 26px;
  }

  .numbers__label {
    font-size: 10px;
    letter-spacing: 0.08em;
  }
}

.hero__text-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: center;
  margin-left: var(--space-2);
  color: var(--muted);
  font-size: 13px;
  letter-spacing: 0.04em;
  transition: color var(--duration-2) var(--ease);
}

.hero__text-link:hover {
  color: var(--accent);
}

.tech-section {
  border-top: 1px solid var(--line);
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.tech-card {
  padding: var(--space-5);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.tech-card__value {
  font-size: clamp(28px, 3vw, 38px);
  color: var(--accent);
}

.tech-card__title {
  margin-top: var(--space-2);
  font-size: 18px;
}

.tech-card__text {
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: 12px;
  line-height: 1.8;
}

.service-section,
.news-section {
  border-top: 1px solid var(--line);
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.service-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
  transition: border-color var(--duration-2) var(--ease), transform var(--duration-2) var(--ease);
}

.service-card:hover {
  border-color: rgba(78, 177, 221, 0.5);
  transform: translateY(-2px);
}

.service-card__index {
  font-size: 11px;
  color: var(--accent-2);
}

.service-card__title {
  font-size: 22px;
}

.service-card__text {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.8;
}

.service-card__arrow {
  position: absolute;
  right: var(--space-5);
  bottom: var(--space-5);
  color: var(--muted);
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.news-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5);
  border-top: 1px solid var(--line);
  transition: background var(--duration-2) var(--ease);
}

.news-card:hover {
  background: rgba(127, 166, 216, 0.04);
}

.news-card__meta {
  display: flex;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--accent-2);
}

.news-card__title {
  font-size: 19px;
  line-height: 1.45;
}

.news-card__text {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.8;
}

.poster-band {
  margin-top: var(--space-6);
  padding-block: var(--space-7);
  border-block: 1px solid var(--line);
  background: var(--surface-2);
}

.poster-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.poster-teaser {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--surface);
}

.poster-teaser img {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  transition: transform 700ms var(--ease);
}

.poster-teaser:hover img {
  transform: scale(1.04);
}

.poster-teaser__meta {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  padding: 28px 14px 12px;
  background: linear-gradient(180deg, transparent, rgba(8, 11, 15, 0.78));
  color: #fff;
}

.poster-teaser__meta strong {
  font-size: 13px;
  font-weight: 500;
}

.poster-teaser__meta small {
  color: rgba(255, 255, 255, 0.62);
  font-family: var(--font-mono);
  font-size: 9px;
}

.cta-band {
  margin-top: var(--space-8);
  border-block: 1px solid var(--line);
  background:
    radial-gradient(900px 260px at 20% 50%, rgba(78, 177, 221, 0.09), transparent 70%),
    var(--surface);
}

.cta-band__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-5);
  padding-block: var(--space-8);
}

.cta-band__title {
  margin-top: var(--space-2);
  font-size: clamp(30px, 4vw, 48px);
}

.cta-band__text {
  max-width: 46ch;
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: 13px;
}

.cta-band__actions {
  display: flex;
  gap: var(--space-3);
}

@media (max-width: 1024px) {
  .tech-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .poster-strip {
    grid-template-columns: 1fr;
  }

  .tech-grid,
  .service-grid,
  .news-grid {
    grid-template-columns: 1fr;
  }

  .cta-band__inner {
    align-items: flex-start;
  }
}
</style>