import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("./pages/HomePage.vue"),
    meta: { title: "首页" },
  },
  {
    path: "/models",
    name: "models",
    component: () => import("./pages/ModelsPage.vue"),
    meta: { title: "车型矩阵" },
  },
  {
    path: "/models/:slug",
    name: "model",
    component: () => import("./pages/ModelPage.vue"),
    meta: { title: "车型详情" },
  },
  {
    path: "/configurator/:slug",
    name: "configurator",
    component: () => import("./pages/ConfiguratorPage.vue"),
    meta: { title: "配置器" },
  },
  {
    path: "/quote",
    name: "quote",
    component: () => import("./pages/QuotePage.vue"),
    meta: { title: "报价单" },
  },
  {
    path: "/order/new",
    name: "order-new",
    component: () => import("./pages/OrderCreatePage.vue"),
    meta: { title: "下订" },
  },
  {
    path: "/pay/:orderNo",
    name: "pay",
    component: () => import("./pages/PayPage.vue"),
    meta: { title: "模拟支付" },
  },
  {
    path: "/orders/:orderNo",
    name: "order",
    component: () => import("./pages/OrderPage.vue"),
    meta: { title: "订单详情" },
  },
  {
    path: "/stores",
    name: "stores",
    component: () => import("./pages/StoresPage.vue"),
    meta: { title: "门店查询" },
  },
  {
    path: "/test-drive",
    name: "test-drive",
    component: () => import("./pages/TestDrivePage.vue"),
    meta: { title: "预约试驾" },
  },
  {
    path: "/finance",
    name: "finance",
    component: () => import("./pages/FinancePage.vue"),
    meta: { title: "金融方案" },
  },
  {
    path: "/service",
    name: "service",
    component: () => import("./pages/ServicePage.vue"),
    meta: { title: "车主服务" },
  },
  {
    path: "/brand",
    name: "brand",
    component: () => import("./pages/BrandPage.vue"),
    meta: { title: "品牌故事" },
  },
  {
    path: "/posters",
    name: "posters",
    component: () => import("./pages/PosterGalleryPage.vue"),
    meta: { title: "车型海报" },
  },
  {
    path: "/news",
    name: "news",
    component: () => import("./pages/NewsPage.vue"),
    meta: { title: "新闻" },
  },
  {
    path: "/admin",
    name: "admin",
    component: () => import("./pages/AdminPage.vue"),
    meta: { title: "管理后台" },
  },
  {
    path: "/login",
    name: "login",
    component: () => import("./pages/LoginPage.vue"),
    meta: { title: "登录" },
  },
  {
    path: "/register",
    name: "register",
    component: () => import("./pages/RegisterPage.vue"),
    meta: { title: "注册" },
  },
  {
    path: "/account",
    name: "account",
    component: () => import("./pages/AccountPage.vue"),
    meta: { title: "我的账户" },
  },
  {
    path: "/wizard",
    name: "wizard",
    component: () => import("./pages/WizardPage.vue"),
    meta: { title: "选车向导" },
  },
  {
    path: "/compare",
    name: "compare",
    component: () => import("./pages/ComparePage.vue"),
    meta: { title: "车型对比" },
  },
  {
    path: "/news/:slug",
    name: "news-detail",
    component: () => import("./pages/NewsDetailPage.vue"),
    meta: { title: "新闻详情" },
  },
  {
    path: "/credits",
    name: "credits",
    component: () => import("./pages/CreditsPage.vue"),
    meta: { title: "素材致谢" },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("./pages/NotFoundPage.vue"),
    meta: { title: "页面不存在" },
  },
];

const DEFAULT_TITLE = "车鉴 CarLens · 多品牌汽车配置聚合与在线报价";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: "smooth" };
    return { top: 0 };
  },
});

router.afterEach((to) => {
  const title = typeof to.meta.title === "string" ? to.meta.title : "";
  document.title = title.length > 0 ? title + " · 车鉴 CarLens" : DEFAULT_TITLE;
});

export default router;