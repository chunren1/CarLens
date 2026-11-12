<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const menuOpen = ref(false);

function closeMenu(): void {
  menuOpen.value = false;
}

function toggleMenu(): void {
  menuOpen.value = !menuOpen.value;
}

async function logout(): Promise<void> {
  closeMenu();
  try {
    await auth.logout();
    await router.push("/");
  } catch {
    // 网络失败时保留当前页面；用户可重试。
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape" && menuOpen.value) closeMenu();
}

onMounted(() => {
  void auth.loadMe().catch(() => undefined);
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  document.body.style.overflow = "";
});

watch(menuOpen, (open) => {
  document.body.style.overflow = open ? "hidden" : "";
});

watch(
  () => route.fullPath,
  () => closeMenu(),
);
</script>

<template>
  <header class="site-header">
    <div class="container site-header__inner">
      <RouterLink to="/" class="brand" aria-label="车鉴首页">
        <img class="brand__mark" src="/images/brand/logo-mark.webp" width="40" height="40" alt="" aria-hidden="true" />
        <span class="brand__text">
          <span class="brand__cn">车鉴</span>
          <span class="brand__en">CarLens</span>
        </span>
      </RouterLink>

      <nav class="nav" aria-label="主导航">
        <RouterLink to="/" class="nav__link" exact-active-class="nav__link--active">首页</RouterLink>
        <RouterLink to="/models" class="nav__link" active-class="nav__link--active">车型</RouterLink>
        <RouterLink to="/wizard" class="nav__link" active-class="nav__link--active">选车</RouterLink>
        <RouterLink to="/stores" class="nav__link" active-class="nav__link--active">门店</RouterLink>
        <RouterLink to="/service" class="nav__link" active-class="nav__link--active">服务</RouterLink>
        <RouterLink to="/brand" class="nav__link" active-class="nav__link--active">了解我们</RouterLink>
        <RouterLink to="/posters" class="nav__link" active-class="nav__link--active">海报</RouterLink>
      </nav>

      <div class="site-header__actions">
        <RouterLink v-if="!auth.isLoggedIn" to="/login" class="site-header__account">登录</RouterLink>
        <template v-else>
          <RouterLink to="/account" class="site-header__account">{{ auth.user?.name }}</RouterLink>
          <button type="button" class="site-header__logout" @click="logout">退出</button>
        </template>
        <span class="site-header__demo">演示环境</span>
        <RouterLink to="/test-drive" class="btn btn--ghost btn--sm">预约试驾</RouterLink>
        <RouterLink to="/configurator/r1" class="btn btn--primary btn--sm">开始配置</RouterLink>
      </div>

      <button
        type="button"
        class="menu-toggle"
        :aria-expanded="menuOpen"
        aria-controls="mobile-menu"
        aria-label="打开导航菜单"
        @click="toggleMenu"
      >
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>

  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="menuOpen" class="menu-layer" @click.self="closeMenu">
        <aside id="mobile-menu" class="mobile-menu" aria-label="移动端导航">
          <div class="mobile-menu__head">
            <span class="mobile-menu__brand">车鉴 <small>CarLens</small></span>
            <button type="button" class="mobile-menu__close" aria-label="关闭导航菜单" @click="closeMenu">×</button>
          </div>

          <nav class="mobile-menu__nav">
            <RouterLink to="/" class="mobile-menu__link" @click="closeMenu">首页 <span>01</span></RouterLink>
            <RouterLink to="/models" class="mobile-menu__link" @click="closeMenu">车型 <span>02</span></RouterLink>
            <RouterLink to="/wizard" class="mobile-menu__link" @click="closeMenu">选车向导 <span>03</span></RouterLink>
            <RouterLink to="/stores" class="mobile-menu__link" @click="closeMenu">门店查询 <span>04</span></RouterLink>
            <RouterLink to="/service" class="mobile-menu__link" @click="closeMenu">车主服务 <span>05</span></RouterLink>
            <RouterLink to="/brand" class="mobile-menu__link" @click="closeMenu">了解我们 <span>06</span></RouterLink>
            <RouterLink to="/posters" class="mobile-menu__link" @click="closeMenu">车型海报 <span>07</span></RouterLink>
            <RouterLink to="/news" class="mobile-menu__link" @click="closeMenu">新闻 <span>08</span></RouterLink>
          </nav>

          <div class="mobile-menu__account">
            <template v-if="!auth.isLoggedIn">
              <RouterLink to="/login" class="btn btn--ghost btn--block" @click="closeMenu">登录 / 注册</RouterLink>
            </template>
            <template v-else>
              <RouterLink to="/account" class="btn btn--ghost btn--block" @click="closeMenu">我的账户 · {{ auth.user?.name }}</RouterLink>
              <button type="button" class="mobile-menu__logout" @click="logout">退出登录</button>
            </template>
          </div>

          <div class="mobile-menu__actions">
            <RouterLink to="/test-drive" class="btn btn--ghost btn--block" @click="closeMenu">预约试驾</RouterLink>
            <RouterLink to="/configurator/r1" class="btn btn--primary btn--block" @click="closeMenu">开始配置</RouterLink>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid rgba(17, 21, 26, 0.08);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(18px) saturate(140%);
}

.site-header__inner {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  height: var(--header-height);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.brand__mark {
  display: block;
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
}

.brand__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1;
}

.brand__cn {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.brand__en {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.32em;
  color: var(--muted);
}

.nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-left: auto;
}

.nav__link {
  position: relative;
  padding: 9px 13px;
  color: #3f4852;
  font-size: 14px;
  transition: color var(--duration-2) var(--ease);
}

.nav__link::after {
  content: "";
  position: absolute;
  left: 13px;
  right: 13px;
  bottom: 2px;
  height: 2px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--duration-3) var(--ease);
}

.nav__link:hover {
  color: var(--text);
}

.nav__link--active {
  color: var(--text);
  font-weight: 600;
}

.nav__link--active::after {
  transform: scaleX(1);
}

.site-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.site-header__account {
  font-size: 12px;
  color: var(--muted);
  transition: color var(--duration-2) var(--ease);
}

.site-header__account:hover {
  color: var(--accent);
}

.site-header__logout {
  font-size: 11px;
  color: var(--muted);
}

.site-header__logout:hover {
  color: var(--danger);
}

.site-header__demo {
  padding: 2px 8px;
  border: 1px solid rgba(78, 177, 221, 0.28);
  border-radius: 6px;
  color: var(--accent);
  background: var(--accent-soft);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
}

.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 44px;
  height: 44px;
  margin-left: auto;
  border: 1px solid var(--line);
  border-radius: 50%;
  align-items: center;
}

.menu-toggle span {
  display: block;
  width: 18px;
  height: 1.5px;
  background: var(--text);
}

/* 移动端抽屉 */
.menu-layer {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(17, 21, 26, 0.36);
  backdrop-filter: blur(3px);
}

.mobile-menu {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(92vw, 380px);
  display: flex;
  flex-direction: column;
  padding: 20px 22px 28px;
  overflow-y: auto;
  background: var(--surface);
  box-shadow: -20px 0 60px rgba(17, 24, 39, 0.16);
}

.mobile-menu__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}

.mobile-menu__brand {
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 0.08em;
}

.mobile-menu__brand small {
  display: block;
  margin-top: 3px;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.3em;
  color: var(--muted);
}

.mobile-menu__close {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 26px;
  line-height: 1;
  color: var(--muted);
}

.mobile-menu__nav {
  display: flex;
  flex-direction: column;
  padding-block: 14px;
}

.mobile-menu__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 54px;
  border-bottom: 1px solid var(--line);
  font-size: 18px;
  color: var(--text);
}

.mobile-menu__link span {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
}

.mobile-menu__account {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 18px;
}

.mobile-menu__logout {
  min-height: 40px;
  color: var(--muted);
  font-size: 12px;
}

.mobile-menu__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
  padding-top: 22px;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity var(--duration-3) var(--ease);
}

.drawer-enter-active .mobile-menu,
.drawer-leave-active .mobile-menu {
  transition: transform var(--duration-4) var(--ease);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .mobile-menu,
.drawer-leave-to .mobile-menu {
  transform: translateX(100%);
}

@media (max-width: 1120px) {
  .nav,
  .site-header__actions {
    display: none;
  }

  .menu-toggle {
    display: flex;
  }
}

@media (max-width: 640px) {
  .site-header__inner {
    height: 64px;
  }

  .brand__mark {
    width: 32px;
    height: 32px;
    font-size: 13px;
  }

  .brand__cn {
    font-size: 16px;
  }
}
</style>