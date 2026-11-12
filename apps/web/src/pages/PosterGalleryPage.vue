<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { assetUrl } from "../lib/assets";

interface Poster {
  file: string;
  title: string;
  category: "轿车" | "SUV" | "发布会";
  subtitle: string;
  source?: string;
}

const posters: Poster[] = [
  { file: "/images/posters/poster-01-seal-07-ev.webp", title: "第二代海豹 07 EV", category: "轿车", subtitle: "海洋美学 · 纯电轿跑" },
  { file: "/images/posters/poster-02-seal-07-dmi.webp", title: "第二代海豹 07 DM-i", category: "轿车", subtitle: "混动与日常，城市光影" },
  { file: "/images/posters/poster-03-qin-plus.webp", title: "第三代秦 PLUS DM-i", category: "轿车", subtitle: "家轿的颜色，也可以很干净" },
  { file: "/images/posters/poster-04-seal-06-ev.webp", title: "2027 款海豹 06 EV", category: "轿车", subtitle: "小车，大色块" },
  { file: "/images/posters/poster-05-han-ev.webp", title: "大汉 EV", category: "轿车", subtitle: "山路、暮色与一条腰线" },
  { file: "/images/posters/poster-06-yuan-up.webp", title: "2027 款元 UP 飞驰版", category: "SUV", subtitle: "把表情包开上路" },
  { file: "/images/posters/poster-07-haishi-08.webp", title: "海狮 08 上市发布会", category: "发布会", subtitle: "阔境自从容" },
  { file: "/images/posters/poster-08-han-tang.webp", title: "大汉预售暨第三代唐首发", category: "发布会", subtitle: "蓝色舞台与两束光" },
  { file: "/images/posters/poster-09-seal-07-launch.webp", title: "第二代海豹 07 上市", category: "发布会", subtitle: "C 级全享座驾" },
  { file: "/images/posters/poster-10-han-launch.webp", title: "大汉上市发布会", category: "发布会", subtitle: "千万王朝，千里大汉" },
  { file: "/images/brands/tesla-model3.webp", title: "特斯拉 Model 3", category: "轿车", subtitle: "官方海报 · 纯电轿车", source: "Tesla 中国官网" },
  { file: "/images/brands/tesla-modely.webp", title: "特斯拉 Model Y", category: "SUV", subtitle: "官方海报 · 纯电 SUV", source: "Tesla 中国官网" },
  { file: "/images/brands/xpeng-p7.webp", title: "小鹏 P7+", category: "轿车", subtitle: "官方海报 · 城市光影", source: "小鹏汽车官网" },
  { file: "/images/brands/zeekr-001.webp", title: "极氪 001", category: "轿车", subtitle: "官方海报 · 猎装轿跑", source: "极氪官网" },
  { file: "/images/brands/xiaomi-su7.webp", title: "小米 SU7", category: "轿车", subtitle: "官方海报 · 新一代 SU7", source: "小米汽车官网" },
  { file: "/images/brands/nio-et5.webp", title: "蔚来 ET5", category: "轿车", subtitle: "官方海报 · 智能电动轿跑", source: "蔚来官网" },
  { file: "/images/brands/li-l6.webp", title: "理想 L6", category: "SUV", subtitle: "官方海报 · 家庭五座 SUV", source: "理想汽车官网" },
  { file: "/images/brands/aito-m7.webp", title: "问界 M7", category: "SUV", subtitle: "官方海报 · 远山与麦田", source: "问界官网" },
  { file: "/images/brands/leapmotor-c10.webp", title: "零跑 C10", category: "SUV", subtitle: "官方海报 · 干净的空间", source: "零跑汽车官网" },
  { file: "/images/brands/aion-i60.webp", title: "埃安 AION i60", category: "SUV", subtitle: "官方海报 · 国民刚需大五座", source: "埃安官网" },
];

// 跨品牌资源优先展示，避免海报馆看起来仍是 BYD 单品牌。
posters.sort((a, b) => Number(b.file.includes("/brands/")) - Number(a.file.includes("/brands/")));

const categories = ["全部", "轿车", "SUV", "发布会"] as const;
const activeCategory = ref<(typeof categories)[number]>("全部");
const visible = computed(() =>
  activeCategory.value === "全部" ? posters : posters.filter((poster) => poster.category === activeCategory.value),
);
const selected = ref<Poster | null>(null);
const selectedIndex = computed(() => (selected.value ? posters.indexOf(selected.value) : -1));

function open(index: number): void {
  selected.value = visible.value[index] ?? null;
}

function close(): void {
  selected.value = null;
}

function step(delta: number): void {
  if (!selected.value) return;
  const index = posters.indexOf(selected.value);
  selected.value = posters[(index + delta + posters.length) % posters.length];
}

function onKeydown(event: KeyboardEvent): void {
  if (!selected.value) return;
  if (event.key === "Escape") close();
  if (event.key === "ArrowRight") step(1);
  if (event.key === "ArrowLeft") step(-1);
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <div class="posters-page">
    <header class="container posters-head">
      <p class="eyebrow">光影 · POSTER ARCHIVE</p>
      <h1 class="page-title">把车，做成一张海报。</h1>
      <p class="posters-lead">
        平台收录了 20 张跨品牌官方高清海报：比亚迪、特斯拉、小鹏、极氪、小米、蔚来、理想、问界、零跑、埃安。
        页面只做毕业设计演示，图片版权归各品牌所有；商业使用请联系官方。
      </p>
      <div class="posters-meta">
        <span>{{ posters.length }} 张</span>
        <span>最高 3840 × 2560</span>
        <span>来源：各品牌官网</span>
      </div>
    </header>

    <div class="container">
      <div class="poster-filters" role="tablist" aria-label="海报分类">
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          class="poster-filter"
          :class="{ 'poster-filter--active': activeCategory === category }"
          :aria-selected="activeCategory === category"
          role="tab"
          @click="activeCategory = category"
        >
          {{ category }}
          <span>{{ category === "全部" ? posters.length : posters.filter((p) => p.category === category).length }}</span>
        </button>
      </div>

      <div class="poster-grid">
        <figure v-for="(poster, index) in visible" :key="poster.file" class="poster-card">
          <button type="button" class="poster-card__button" :aria-label="'查看 ' + poster.title" @click="open(index)">
            <img
              :src="assetUrl(poster.file)"
              :alt="poster.title + ' 官方海报'"
              loading="lazy"
              decoding="async"
            />
            <span class="poster-card__zoom" aria-hidden="true">↗</span>
          </button>
          <figcaption class="poster-card__caption">
            <span class="poster-card__title">{{ poster.title }}</span>
            <span class="poster-card__sub">{{ poster.subtitle }}</span>
            <span class="poster-card__tag">{{ poster.category }}</span>
          </figcaption>
        </figure>
      </div>

      <p class="posters-source">
        素材来源：比亚迪、特斯拉、小鹏、极氪、小米、蔚来、理想、问界、零跑、埃安官网公开车型 / 发布会海报，仅用于毕业设计展示与教学说明；版权归各品牌所有。
        <RouterLink to="/credits">查看素材致谢 →</RouterLink>
      </p>
    </div>

    <Teleport to="body">
      <div v-if="selected" class="poster-lightbox" role="dialog" aria-modal="true" aria-label="海报大图" @click.self="close">
        <button type="button" class="poster-lightbox__close" aria-label="关闭" @click="close">×</button>
        <button type="button" class="poster-lightbox__arrow poster-lightbox__arrow--prev" aria-label="上一张" @click="step(-1)">←</button>
        <figure class="poster-lightbox__figure">
          <img :src="assetUrl(selected.file)" :alt="selected.title + ' 官方海报'" />
          <figcaption>
            <strong>{{ selected.title }}</strong>
            <span>{{ selected.subtitle }}</span>
            <small>{{ selectedIndex + 1 }} / {{ posters.length }} · 图片来源：{{ selected.source ?? "比亚迪官网" }}</small>
          </figcaption>
        </figure>
        <button type="button" class="poster-lightbox__arrow poster-lightbox__arrow--next" aria-label="下一张" @click="step(1)">→</button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.posters-page {
  padding-block: var(--space-7) var(--space-9);
}

.posters-head {
  max-width: 900px;
}

.posters-lead {
  max-width: 68ch;
  margin-top: var(--space-3);
  color: var(--muted);
  font-size: 14px;
  line-height: 1.9;
}

.posters-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-top: var(--space-4);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.poster-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-block: var(--space-6) var(--space-5);
  padding-top: var(--space-5);
  border-top: 1px solid var(--line);
}

.poster-filter {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  color: var(--muted);
  font-size: 12px;
  transition: all var(--duration-2) var(--ease);
}

.poster-filter span {
  font-family: var(--font-mono);
  font-size: 9px;
  color: #9aa4b1;
}

.poster-filter:hover,
.poster-filter--active {
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
}

.poster-filter--active span,
.poster-filter:hover span {
  color: rgba(255, 255, 255, 0.72);
}

.poster-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-5) var(--space-4);
}

.poster-card {
  margin: 0;
}

.poster-card__button {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--surface-2);
}

.poster-card__button img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 700ms var(--ease);
}

.poster-card:hover img {
  transform: scale(1.045);
}

.poster-card__zoom {
  position: absolute;
  top: 10px;
  right: 10px;
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50%;
  background: rgba(17, 24, 39, 0.68);
  color: #fff;
  font-size: 14px;
  opacity: 0;
  backdrop-filter: blur(6px);
  transition: opacity var(--duration-2) var(--ease);
}

.poster-card:hover .poster-card__zoom {
  opacity: 1;
}

.poster-card__caption {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px var(--space-2);
  padding-top: 10px;
}

.poster-card__title {
  font-size: 14px;
  color: var(--text);
}

.poster-card__sub {
  grid-column: 1;
  color: var(--muted);
  font-size: 11px;
}

.poster-card__tag {
  grid-column: 2;
  grid-row: 1;
  padding: 2px 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  color: var(--muted);
  font-size: 9px;
}

.posters-source {
  margin-top: var(--space-7);
  padding-top: var(--space-4);
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 11px;
  line-height: 1.8;
}

.posters-source a {
  color: var(--accent);
}

.poster-lightbox {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-6) var(--space-8);
  background: rgba(10, 14, 20, 0.9);
  backdrop-filter: blur(10px);
}

.poster-lightbox__figure {
  max-width: min(1180px, 86vw);
  margin: 0;
  color: #fff;
}

.poster-lightbox__figure img {
  width: 100%;
  max-height: 76vh;
  object-fit: contain;
  border-radius: var(--radius-sm);
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.4);
}

.poster-lightbox__figure figcaption {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2) var(--space-4);
  margin-top: var(--space-3);
}

.poster-lightbox__figure strong {
  font-size: 16px;
}

.poster-lightbox__figure span {
  color: rgba(255, 255, 255, 0.66);
  font-size: 12px;
}

.poster-lightbox__figure small {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.46);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.04em;
}

.poster-lightbox__close {
  position: absolute;
  top: 18px;
  right: 22px;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 50%;
  color: #fff;
  font-size: 24px;
}

.poster-lightbox__arrow {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 50%;
  color: #fff;
  font-size: 17px;
}

.poster-lightbox__arrow:hover,
.poster-lightbox__close:hover {
  border-color: var(--accent);
  background: var(--accent);
}

@media (max-width: 1024px) {
  .poster-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .posters-page {
    padding-block: var(--space-5) var(--space-7);
  }

  .poster-grid {
    grid-template-columns: 1fr;
    gap: var(--space-5);
  }

  .poster-lightbox {
    padding: var(--space-4);
  }

  .poster-lightbox__arrow {
    display: none;
  }

  .poster-lightbox__figure {
    max-width: 94vw;
  }

  .poster-lightbox__figure small {
    margin-left: 0;
  }
}
</style>