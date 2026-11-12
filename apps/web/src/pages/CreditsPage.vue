<script setup lang="ts">
import { RouterLink } from "vue-router";
import { assetUrl } from "../lib/assets";
const assets = [
  {
    id: "r1",
    model: "比亚迪 海豹",
    asset: "Car Concept",
    author: "Eric Chadwick（Darmstadt Graphics Group GmbH）",
    origin: "原始模型 Unity Fan（CC0 / 公有领域），经 DGG RapidPipeline 优化为 glTF 示例资产",
    license: "CC BY 4.0 International",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    source: "https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept",
    sourceLabel: "Khronos glTF Sample Assets · Models/CarConcept",
    changes: "运行时按车漆与轮毂选项修改材质颜色；隐藏原始车牌与方向盘徽标。",
  },
  {
    id: "s7",
    model: "比亚迪 汉 EV",
    asset: "Generic Sedan Car",
    author: "MMC Works",
    origin: "Sketchfab 免费 3D 模型，用于非商业演示",
    license: "CC BY 4.0 International",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    source: "https://sketchfab.com/3d-models/generic-sedan-car-58c33766470d46e7b2aed542650494e5",
    sourceLabel: "Sketchfab · MMC Works",
    changes: "运行时按车漆选项修改车身材质颜色。",
  },
];

const posters = [
  { title: "第二代海豹 07 EV", file: "/images/posters/poster-01-seal-07-ev.webp" },
  { title: "第二代海豹 07 DM-i", file: "/images/posters/poster-02-seal-07-dmi.webp" },
  { title: "第三代秦 PLUS DM-i", file: "/images/posters/poster-03-qin-plus.webp" },
  { title: "2027 款海豹 06 EV", file: "/images/posters/poster-04-seal-06-ev.webp" },
  { title: "大汉 EV", file: "/images/posters/poster-05-han-ev.webp" },
  { title: "2027 款元 UP 飞驰版", file: "/images/posters/poster-06-yuan-up.webp" },
  { title: "海狮 08 发布会", file: "/images/posters/poster-07-haishi-08.webp" },
  { title: "大汉预售 / 唐首发", file: "/images/posters/poster-08-han-tang.webp" },
  { title: "第二代海豹 07 上市", file: "/images/posters/poster-09-seal-07-launch.webp" },
  { title: "大汉上市发布会", file: "/images/posters/poster-10-han-launch.webp" },
];

const brandPosters = [
  { title: "特斯拉 Model 3", file: "/images/brands/tesla-model3.webp", source: "Tesla 中国官网" },
  { title: "特斯拉 Model Y", file: "/images/brands/tesla-modely.webp", source: "Tesla 中国官网" },
  { title: "小鹏 P7+", file: "/images/brands/xpeng-p7.webp", source: "小鹏汽车官网" },
  { title: "极氪 001", file: "/images/brands/zeekr-001.webp", source: "极氪官网" },
  { title: "小米 SU7", file: "/images/brands/xiaomi-su7.webp", source: "小米汽车官网" },
  { title: "蔚来 ET5", file: "/images/brands/nio-et5.webp", source: "蔚来官网" },
  { title: "理想 L6", file: "/images/brands/li-l6.webp", source: "理想汽车官网" },
  { title: "问界 M7", file: "/images/brands/aito-m7.webp", source: "问界官网" },
  { title: "零跑 C10", file: "/images/brands/leapmotor-c10.webp", source: "零跑汽车官网" },
  { title: "埃安 AION i60", file: "/images/brands/aion-i60.webp", source: "埃安官网" },
];

const libraries = [
  {
    name: "three.js",
    license: "MIT",
    usage: "3D 技术实验代码保留；当前页面不再加载 GLTFLoader / KTX2Loader / Reflector / EffectComposer。",
    url: "https://github.com/mrdoob/three.js",
    licenseUrl: "https://github.com/mrdoob/three.js/blob/dev/LICENSE",
  },
  {
    name: "Vue 3",
    license: "MIT",
    usage: "前端框架（Composition API + 单文件组件）。",
    url: "https://github.com/vuejs/core",
    licenseUrl: "https://github.com/vuejs/core/blob/main/LICENSE",
  },
  {
    name: "Vite",
    license: "MIT",
    usage: "开发服务器与生产构建。",
    url: "https://github.com/vitejs/vite",
    licenseUrl: "https://github.com/vitejs/vite/blob/main/LICENSE",
  },
  {
    name: "Pinia",
    license: "MIT",
    usage: "配置器状态管理。",
    url: "https://github.com/vuejs/pinia",
    licenseUrl: "https://github.com/vuejs/pinia/blob/v3/LICENSE",
  },
  {
    name: "Vue Router",
    license: "MIT",
    usage: "前端路由与页面懒加载。",
    url: "https://github.com/vuejs/router",
    licenseUrl: "https://github.com/vuejs/router/blob/main/LICENSE",
  },
];
</script>

<template>
  <div class="page container credits-page">
    <header class="page-head">
      <p class="eyebrow">素材致谢 · CREDITS</p>
      <h1 class="page-title">站在别人的作品上</h1>
      <p class="page-sub">
        本站是毕业设计演示，非任何汽车品牌官方网站。本页列出 Demo 中使用的第三方车型图/3D 素材与开源软件，并注明授权与修改方式。素材仅用于课程作业与毕业设计演示，不作商业用途。
      </p>
    </header>

    <section class="section">
      <div class="section-head">
        <div>
          <p class="eyebrow">官方海报 · 多品牌</p>
          <h2 class="section-title">车型海报</h2>
        </div>
        <RouterLink to="/posters" class="more-link">海报馆 <span aria-hidden="true">→</span></RouterLink>
      </div>
      <p class="section-sub muted">
        图片来自比亚迪、特斯拉、小鹏、极氪、小米、蔚来、理想、问界、零跑、埃安官网公开车型 / 发布会海报，版权归各品牌所有，仅用于毕业设计展示与教学说明，不构成官方授权；商业使用请联系对应品牌。
      </p>
      <div class="poster-credit-grid">
        <figure v-for="poster in posters" :key="poster.file">
          <img :src="assetUrl(poster.file)" :alt="poster.title" loading="lazy" />
          <figcaption>{{ poster.title }}<small>来源：byd.com</small></figcaption>
        </figure>
      </div>

      <h3 class="credit-subtitle">跨品牌海报</h3>
      <div class="poster-credit-grid">
        <figure v-for="poster in brandPosters" :key="poster.file">
          <img :src="assetUrl(poster.file)" :alt="poster.title" loading="lazy" />
          <figcaption>{{ poster.title }}<small>{{ poster.source }}</small></figcaption>
        </figure>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <p class="eyebrow">3D 示意资产 · 共用四门轿车</p>
          <h2 class="section-title">车身模型</h2>
        </div>
        <p class="section-sub muted">配置器按需加载 s7 四门轿车模型；以下署名按 CC BY 4.0 保留。</p>
      </div>

      <div class="credit-list">
        <article v-for="item in assets" :key="item.id" class="credit-card card">
          <div class="credit-card__head">
            <div>
              <p class="credit-card__model">{{ item.model }}</p>
              <h3 class="credit-card__name">{{ item.asset }}</h3>
            </div>
            <a
              class="badge credit-card__license"
              :href="item.licenseUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ item.license }}
            </a>
          </div>

          <dl class="credit-card__meta">
            <div>
              <dt>作者</dt>
              <dd>{{ item.author }}</dd>
            </div>
            <div>
              <dt>来源</dt>
              <dd>
                <a :href="item.source" target="_blank" rel="noopener noreferrer">
                  {{ item.sourceLabel }}
                </a>
              </dd>
            </div>
            <div>
              <dt>原始素材</dt>
              <dd>{{ item.origin }}</dd>
            </div>
            <div>
              <dt>修改</dt>
              <dd>{{ item.changes }}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <p class="eyebrow">开源软件</p>
          <h2 class="section-title">运行库</h2>
        </div>
        <p class="section-sub muted">以下项目以 MIT 许可证发布，保留原始版权声明。</p>
      </div>

      <ul class="library-list">
        <li v-for="library in libraries" :key="library.name" class="library card">
          <div class="library__head">
            <a :href="library.url" target="_blank" rel="noopener noreferrer" class="library__name">
              {{ library.name }}
            </a>
            <a :href="library.licenseUrl" target="_blank" rel="noopener noreferrer" class="badge">
              {{ library.license }}
            </a>
          </div>
          <p class="library__usage">{{ library.usage }}</p>
        </li>
      </ul>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <p class="eyebrow">字体与图形</p>
          <h2 class="section-title">排版说明</h2>
        </div>
      </div>
      <ul class="notes">
        <li class="note card">
          <h3 class="note__title">中文字体</h3>
          <p class="note__text">
            标题使用 Noto Serif SC / Songti SC / STSong 衬线字体栈，正文使用 Noto Sans SC / PingFang SC / Microsoft YaHei
            无衬线字体栈（SIL Open Font License 1.1）。页面不加载 CJK 网络字体，优先调用系统字体以控制首屏体积。
          </p>
        </li>
        <li class="note card">
          <h3 class="note__title">数字与等宽</h3>
          <p class="note__text">
            价格、订单号与参数使用 JetBrains Mono / SFMono-Regular / ui-monospace 等宽字体栈，开启 tabular-nums 保证数字对齐。
          </p>
        </li>
        <li class="note card">
          <h3 class="note__title">图形与图标</h3>
          <p class="note__text">
            页面未使用第三方图标库：分隔线、轮毂图形、勾选框与状态点均由 CSS 绘制；环境光贴图由 three.js 在运行时以程序生成（PMREM），不含第三方 HDR 素材。
          </p>
        </li>
        <li class="note card">
          <h3 class="note__title">演示数据</h3>
          <p class="note__text">
            车型名称「比亚迪 海豹 / 汉 EV」、参数、价格、门店与订单均为演示数据，与素材原作者及比亚迪无关；车鉴不隶属于任何车企，支付为模拟网关，不产生真实交易。
          </p>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.credit-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.credit-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
}

.credit-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--line);
}

.credit-card__model {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--accent-2);
}

.credit-card__name {
  margin-top: var(--space-1);
  font-size: 24px;
}

.credit-card__license {
  flex: 0 0 auto;
  transition: color var(--duration-2) var(--ease), border-color var(--duration-2) var(--ease);
}

.credit-card__license:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.credit-card__meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
}

.credit-card__meta dt {
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--muted);
}

.credit-card__meta dd {
  margin: 2px 0 0;
  font-size: 13px;
  line-height: 1.75;
}

.credit-card__meta a,
.library__name {
  color: var(--accent-2);
  text-decoration: underline;
  text-decoration-color: rgba(127, 166, 216, 0.35);
  text-underline-offset: 3px;
  transition: color var(--duration-2) var(--ease);
}

.credit-card__meta a:hover,
.library__name:hover {
  color: var(--accent);
}

.library-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.library {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5);
}

.library__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.library__name {
  font-family: var(--font-display);
  font-size: 18px;
  text-decoration: none;
}

.library__usage {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}

.notes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.note {
  padding: var(--space-5);
}

.note__title {
  font-size: 18px;
}

.note__text {
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: 12px;
  line-height: 1.85;
}

@media (max-width: 1024px) {
  .credit-list,
  .library-list,
  .notes {
    grid-template-columns: 1fr;
  }
}
.credit-subtitle {
  margin: var(--space-6) 0 0;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--muted);
  text-transform: uppercase;
}

.poster-credit-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.poster-credit-grid figure {
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
}

.poster-credit-grid img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
}

.poster-credit-grid figcaption {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  font-size: 11px;
}

.poster-credit-grid small {
  color: var(--muted);
  font-size: 9px;
}

@media (max-width: 900px) {
  .poster-credit-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>