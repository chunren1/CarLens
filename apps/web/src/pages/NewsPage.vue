<script setup lang="ts">
import { onMounted, ref, shallowRef } from "vue";
import { RouterLink } from "vue-router";
import type { NewsArticle } from "@wangshu/shared";
import StateBlock from "../components/StateBlock.vue";
import { api, errorMessage } from "../lib/api";

const news = shallowRef<NewsArticle[]>([]);
const state = ref<"loading" | "ready" | "error" | "empty">("loading");
const error = ref("");

async function load(): Promise<void> {
  state.value = "loading";
  error.value = "";
  try {
    const list = await api.listNews();
    news.value = list;
    state.value = list.length > 0 ? "ready" : "empty";
  } catch (err) {
    error.value = errorMessage(err);
    state.value = "error";
  }
}

function formatDate(value: string): string {
  const date = new Date(value + (value.length === 10 ? "T00:00:00+08:00" : ""));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" });
}

onMounted(() => {
  void load();
});
</script>

<template>
  <div class="page container">
    <header class="page-head">
      <p class="eyebrow">新闻</p>
      <h1 class="page-title">车市，最近在做什么</h1>
      <p class="page-sub">产品、服务与品牌的最新动态。演示内容，不构成真实发布。</p>
    </header>

    <StateBlock
      :state="state"
      :error="error"
      loading-text="正在读取新闻…"
      empty-title="暂无新闻"
      empty-text="内容正在更新，请稍后再来。"
      @retry="load"
    >
      <div class="news-list">
        <RouterLink
          v-for="item in news"
          :key="item.id"
          :to="{ name: 'news-detail', params: { slug: item.slug } }"
          class="news-item"
        >
          <div class="news-item__meta">
            <span class="news-item__date num">{{ formatDate(item.publishedAt) }}</span>
            <span class="news-item__tag">{{ item.tag }}</span>
          </div>
          <div class="news-item__body">
            <h2 class="news-item__title">{{ item.title }}</h2>
            <p class="news-item__text">{{ item.summary }}</p>
          </div>
          <span class="news-item__arrow" aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </StateBlock>
  </div>
</template>

<style scoped>
.news-list {
  border-top: 1px solid var(--line);
}

.news-item {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr) 40px;
  gap: var(--space-5);
  align-items: start;
  padding: var(--space-5) 0;
  border-bottom: 1px solid var(--line);
  transition: background var(--duration-2) var(--ease);
}

.news-item:hover {
  background: rgba(127, 166, 216, 0.03);
}

.news-item__meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.news-item__date {
  font-size: 12px;
  color: var(--muted);
}

.news-item__tag {
  width: fit-content;
  padding: 2px 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--accent-2);
}

.news-item__title {
  font-size: 22px;
}

.news-item__text {
  max-width: 68ch;
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: 13px;
  line-height: 1.8;
}

.news-item__arrow {
  color: var(--muted);
  font-size: 18px;
  transition: color var(--duration-2) var(--ease);
}

.news-item:hover .news-item__arrow {
  color: var(--accent);
}

@media (max-width: 720px) {
  .news-item {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }

  .news-item__arrow {
    display: none;
  }
}
</style>