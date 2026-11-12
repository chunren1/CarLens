<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from "vue";
import { RouterLink, useRoute } from "vue-router";
import type { NewsArticle } from "@wangshu/shared";
import { api, errorMessage } from "../lib/api";

const route = useRoute();
const slug = computed(() => String(route.params.slug ?? ""));
const article = shallowRef<NewsArticle | null>(null);
const state = ref<"loading" | "ready" | "error" | "empty">("loading");
const error = ref("");

const paragraphs = computed(() =>
  (article.value?.body ?? "").split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean),
);

function formatDate(value: string): string {
  const date = new Date(value + (value.length === 10 ? "T00:00:00+08:00" : ""));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" });
}

async function load(): Promise<void> {
  state.value = "loading";
  error.value = "";
  try {
    const next = await api.getNews(slug.value);
    article.value = next;
    state.value = "ready";
  } catch (err) {
    error.value = errorMessage(err);
    state.value = "error";
  }
}

onMounted(() => {
  void load();
});
</script>

<template>
  <div class="page container article-page">
    <RouterLink to="/news" class="back-link">← 全部新闻</RouterLink>

    <div v-if="state === 'loading'" class="article-state">正在读取文章…</div>
    <div v-else-if="state === 'error'" class="article-state">{{ error }}</div>

    <article v-else-if="article" class="article">
      <header class="article__head">
        <p class="article__meta"><span class="num">{{ formatDate(article.publishedAt) }}</span><span class="article__tag">{{ article.tag }}</span></p>
        <h1 class="article__title">{{ article.title }}</h1>
        <p class="article__summary">{{ article.summary }}</p>
      </header>
      <div class="article__body">
        <p v-for="paragraph in paragraphs" :key="paragraph">{{ paragraph }}</p>
      </div>
      <footer class="article__foot">
        <RouterLink to="/news" class="btn btn--ghost btn--sm">继续阅读</RouterLink>
        <RouterLink to="/models" class="btn btn--primary btn--sm">去看车型</RouterLink>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.article-page {
  max-width: 900px;
  padding-block: var(--space-6);
}

.article-state {
  padding: var(--space-6);
  color: var(--muted);
}

.article {
  margin-top: var(--space-5);
}

.article__head {
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--line);
}

.article__meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.article__tag {
  padding: 2px 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  color: var(--accent-2);
}

.article__title {
  margin-top: var(--space-3);
  font-size: clamp(30px, 4vw, 48px);
  line-height: 1.3;
}

.article__summary {
  margin-top: var(--space-3);
  color: var(--muted);
  font-size: 15px;
  line-height: 1.9;
}

.article__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-6);
  color: #c3ccd6;
  font-size: 15px;
  line-height: 2;
}

.article__foot {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-7);
  padding-top: var(--space-5);
  border-top: 1px solid var(--line);
}
</style>
