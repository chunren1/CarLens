<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import SiteHeader from "./components/SiteHeader.vue";
import SiteFooter from "./components/SiteFooter.vue";

const route = useRoute();
const isAdmin = computed(() => route.path.startsWith("/admin"));
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--admin': isAdmin }">
    <a class="skip-link" href="#main">跳到主要内容</a>
    <SiteHeader v-if="!isAdmin" />
    <main id="main" class="app-main">
      <RouterView />
    </main>
    <SiteFooter v-if="!isAdmin" />
  </div>
</template>

<style scoped>
.app-shell--admin {
  min-height: 100vh;
}
</style>
