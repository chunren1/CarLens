<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import type { ModelSummary } from "@wangshu/shared";
import { assetUrl } from "../lib/assets";

const props = defineProps<{ models?: ModelSummary[] }>();
const emit = defineEmits<{ change: [slug: string] }>();

interface Slide {
  slug: string;
  name: string;
  eyebrow: string;
  title: string;
  lead: string;
  image: string;
  to: string;
}

const fallback: Slide[] = [
  {
    slug: "r1",
    name: "比亚迪 海豹",
    eyebrow: "四门轿跑 · 650 km",
    title: "把热爱，开回家。",
    lead: "海豹，四门轿跑，650 km 续航，3.8 秒破百。把驾驶乐趣留在日常里。",
    image: "/images/seal-hero.webp",
    to: "/models/r1",
  },
  {
    slug: "s7",
    name: "比亚迪 汉 EV",
    eyebrow: "旗舰轿车 · 701 km",
    title: "把从容，开回家。",
    lead: "汉 EV，四门五座，701 km 续航。把东方审美和日常通勤，放在同一台车里。",
    image: "/images/han-hero.webp",
    to: "/models/s7",
  },
];

function slideFor(model: ModelSummary): Slide {
  const isR1 = model.slug === "r1";
  const isS7 = model.slug === "s7";
  const title = isR1 ? "把热爱，开回家。" : isS7 ? "把从容，开回家。" : model.tagline;
  const lead = isR1
    ? "海豹，四门轿跑，650 km 续航，3.8 秒破百。把驾驶乐趣留在日常里。"
    : isS7
      ? "汉 EV，四门五座，701 km 续航。把东方审美和日常通勤，放在同一台车里。"
      : model.name + "，" + model.body + "，" + model.rangeKm + " km 续航" + (model.zero100 > 0 ? "，" + model.zero100 + " 秒破百" : "") + "。" + model.tagline + "。";
  return {
    slug: model.slug,
    name: model.name,
    eyebrow: model.brand + " · " + model.body + " · " + model.rangeKm + " km",
    title,
    lead,
    image: model.heroImage || "/images/seal-hero.webp",
    to: "/models/" + model.slug,
  };
}

const slides = computed<Slide[]>(() => {
  const list = props.models ?? [];
  return list.length > 0 ? list.map(slideFor) : fallback;
});

const active = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;
let paused = false;

function stop(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

function start(): void {
  stop();
  if (slides.value.length < 2) return;
  timer = setInterval(() => {
    if (!paused) active.value = (active.value + 1) % slides.value.length;
  }, 6000);
}

function go(index: number): void {
  active.value = (index + slides.value.length) % slides.value.length;
  start();
}

function next(): void {
  go(active.value + 1);
}

function prev(): void {
  go(active.value - 1);
}

function pause(): void {
  paused = true;
}

function resume(): void {
  paused = false;
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === "ArrowRight") next();
  if (event.key === "ArrowLeft") prev();
}

onMounted(start);
onBeforeUnmount(stop);
watch(active, () => {
  const slug = slides.value[active.value]?.slug;
  if (slug) emit("change", slug);
});

watch(slides, () => {
  active.value = 0;
  start();
  const slug = slides.value[0]?.slug;
  if (slug) emit("change", slug);
});
</script>

<template>
  <section
    class="hero-carousel"
    aria-roledescription="carousel"
    aria-label="车鉴车型推荐"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="pause"
    @focusout="resume"
    @keydown="onKeydown"
  >
    <div class="hero-carousel__stage">
      <div
        v-for="(slide, index) in slides"
        :key="slide.slug"
        class="hero-carousel__slide"
        :class="{ 'hero-carousel__slide--active': index === active }"
        :aria-hidden="index !== active"
      >
        <img
          :src="assetUrl(slide.image)"
          :alt="slide.name + ' 车型海报'"
          :fetchpriority="index === 0 ? 'high' : 'low'"
          :loading="index === 0 ? 'eager' : 'lazy'"
        />
      </div>
      <div class="hero-carousel__scrim" aria-hidden="true"></div>

      <div class="container hero-carousel__inner">
        <Transition name="hero-copy" mode="out-in">
          <div :key="slides[active]?.slug" class="hero-carousel__copy">
            <p class="hero-carousel__eyebrow">{{ slides[active]?.eyebrow }}</p>
            <h1 class="hero-carousel__title">{{ slides[active]?.title }}</h1>
            <p class="hero-carousel__lead">{{ slides[active]?.lead }}</p>
            <div class="hero-carousel__actions">
              <RouterLink to="/brand" class="btn btn--primary btn--lg">了解我们</RouterLink>
              <RouterLink to="/test-drive" class="btn btn--ghost btn--lg">预约试驾</RouterLink>
              <RouterLink :to="slides[active]?.to ?? '/models'" class="hero-carousel__link">
                查看 {{ slides[active]?.name }} <span aria-hidden="true">→</span>
              </RouterLink>
            </div>
          </div>
        </Transition>
      </div>

      <div class="hero-carousel__controls">
        <button type="button" class="hero-carousel__arrow" aria-label="上一张" @click="prev">←</button>
        <div class="hero-carousel__dots" role="tablist" aria-label="车型推荐">
          <button
            v-for="(slide, index) in slides"
            :key="slide.slug"
            type="button"
            class="hero-carousel__dot"
            :class="{ 'hero-carousel__dot--active': index === active }"
            :aria-label="'查看 ' + slide.name"
            :aria-selected="index === active"
            role="tab"
            @click="go(index)"
          ></button>
        </div>
        <button type="button" class="hero-carousel__arrow" aria-label="下一张" @click="next">→</button>
        <span class="hero-carousel__count num">{{ String(active + 1).padStart(2, "0") }} / {{ String(slides.length).padStart(2, "0") }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-carousel {
  position: relative;
  overflow: hidden;
  padding: 14px var(--space-4) 0;
  background: var(--surface);
}

.hero-carousel__stage {
  position: relative;
  min-height: clamp(560px, 78vh, 760px);
  margin-inline: auto;
  max-width: 1500px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
}

.hero-carousel__slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: scale(1.035);
  transition: opacity 900ms var(--ease), transform 7s linear;
}

.hero-carousel__slide--active {
  opacity: 1;
  transform: scale(1);
  z-index: 1;
}

.hero-carousel__slide img {
  display: block;
  width: 56%;
  height: 100%;
  margin-left: auto;
  object-fit: cover;
  object-position: 58% 50%;
}

.hero-carousel__slide::after {
  content: "";
  position: absolute;
  inset: 0 44% 0 0;
  z-index: 1;
  background: linear-gradient(90deg, #fff 0%, rgba(255, 255, 255, 0.94) 55%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
}

.hero-carousel__scrim {
  display: none;
}

.hero-carousel__inner {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  min-height: clamp(560px, 78vh, 760px);
  padding-block: var(--space-8);
}

.hero-carousel__copy {
  max-width: 42%;
  color: var(--text);
}

.hero-carousel__eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--accent);
}

.hero-carousel__title {
  margin-top: var(--space-4);
  font-size: clamp(34px, 3.7vw, 52px);
  line-height: 1.16;
  letter-spacing: 0.02em;
  color: var(--text);
}

.hero-carousel__lead {
  max-width: 46ch;
  margin-top: var(--space-5);
  color: var(--muted);
  font-size: 14px;
  line-height: 1.9;
}

.hero-carousel__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.hero-carousel__actions .btn--ghost {
  border-color: var(--line);
  color: var(--text);
}

.hero-carousel__actions .btn--ghost:hover {
  border-color: var(--accent);
  background: transparent;
  color: var(--accent);
}

.hero-carousel__link {
  margin-left: var(--space-2);
  color: var(--muted);
  font-size: 12px;
}

.hero-carousel__link:hover {
  color: var(--accent);
}

.hero-carousel__controls {
  position: absolute;
  z-index: 4;
  left: max(24px, calc((100% - 1280px) / 2 + 32px));
  right: max(24px, calc((100% - 1280px) / 2 + 32px));
  bottom: 22px;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.hero-carousel__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--text);
  font-size: 15px;
  transition: background var(--duration-2) var(--ease), border-color var(--duration-2) var(--ease);
}

.hero-carousel__arrow:hover {
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
}

.hero-carousel__dots {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: var(--space-2);
}

.hero-carousel__dot {
  width: 22px;
  height: 3px;
  border-radius: 999px;
  background: #cdd4dd;
  transition: width var(--duration-3) var(--ease), background var(--duration-3) var(--ease);
}

.hero-carousel__dot--active {
  width: 46px;
  background: var(--accent);
}

.hero-carousel__count {
  margin-left: var(--space-3);
  color: var(--muted);
  font-size: 10px;
  letter-spacing: 0.1em;
}

.hero-copy-enter-active,
.hero-copy-leave-active {
  transition: opacity 360ms var(--ease), transform 360ms var(--ease);
}

.hero-copy-enter-from {
  opacity: 0;
  transform: translateY(14px);
}

.hero-copy-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 900px) {
  .hero-carousel {
    padding: 0;
  }

  .hero-carousel__stage {
    min-height: 620px;
    border: 0;
    border-radius: 0;
    background: var(--surface);
  }

  .hero-carousel__slide {
    background: transparent;
  }

  .hero-carousel__slide img {
    width: 100%;
    height: 50%;
    margin-left: 0;
    object-fit: cover;
    object-position: center 52%;
  }

  .hero-carousel__slide::after {
    display: block;
    inset: auto 0 0 0;
    height: 52%;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #fff 52%, #fff 100%);
  }

  .hero-carousel__scrim {
    display: none;
  }

  .hero-carousel__inner {
    min-height: 620px;
    align-items: flex-end;
    padding-bottom: 86px;
  }

  .hero-carousel__copy {
    max-width: 100%;
    color: var(--text);
  }

  .hero-carousel__eyebrow {
    display: none;
  }

  .hero-carousel__title {
    margin-top: var(--space-3);
    font-size: clamp(34px, 9vw, 48px);
    color: var(--text);
  }

  .hero-carousel__lead {
    margin-top: var(--space-3);
    color: var(--muted);
    font-size: 13px;
    line-height: 1.8;
  }

  .hero-carousel__actions {
    margin-top: var(--space-4);
  }

  .hero-carousel__actions .btn--ghost {
    border-color: var(--line);
    color: var(--text);
  }

  .hero-carousel__link {
    color: var(--muted);
  }

  .hero-carousel__controls {
    left: var(--space-4);
    right: var(--space-4);
    bottom: 18px;
  }

  /* 12 个车型时移动端 dots 会挤出视口；改用箭头 + 计数器。 */
  .hero-carousel__dots {
    display: none;
  }

  .hero-carousel__count {
    margin-left: auto;
  }
}

@media (max-width: 560px) {
  .hero-carousel__stage,
  .hero-carousel__inner {
    min-height: 560px;
  }

  .hero-carousel__inner {
    padding-bottom: 82px;
  }

  .hero-carousel__actions {
    gap: 8px;
  }

  .hero-carousel__actions .btn {
    flex: 1;
    padding-inline: var(--space-3);
  }

  .hero-carousel__link {
    width: 100%;
    margin-left: 0;
    margin-top: 4px;
  }

  .hero-carousel__arrow {
    width: 34px;
    height: 34px;
  }
}
</style>