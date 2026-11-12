<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <footer class="site-footer">
    <div class="container site-footer__grid">
      <div class="site-footer__brand">
        <p class="site-footer__logo"><img src="/images/brand/logo-carlens.webp" alt="车鉴 CarLens" class="site-footer__logo-img" /></p>
        <p class="site-footer__claim">多品牌的车，放在一起讲清楚。</p>
        <p class="site-footer__note">
          毕业设计演示 · 多品牌汽车聚合平台，非任何汽车品牌官方网站。价格、门店与订单均为演示数据，支付为模拟网关。
        </p>
      </div>

      <nav class="site-footer__col" aria-label="车型链接">
        <p class="site-footer__title">车型</p>
        <RouterLink to="/models/r1" class="site-footer__link">比亚迪 海豹</RouterLink>
        <RouterLink to="/models/s7" class="site-footer__link">比亚迪 汉 EV</RouterLink>
        <RouterLink to="/models" class="site-footer__link">全部车型</RouterLink>
        <RouterLink to="/wizard" class="site-footer__link">选车向导</RouterLink>
        <RouterLink to="/compare" class="site-footer__link">车型对比</RouterLink>
      </nav>

      <nav class="site-footer__col" aria-label="购车链接">
        <p class="site-footer__title">购车</p>
        <RouterLink to="/configurator/r1" class="site-footer__link">配置 海豹</RouterLink>
        <RouterLink to="/configurator/s7" class="site-footer__link">配置 汉 EV</RouterLink>
        <RouterLink to="/quote" class="site-footer__link">我的报价单</RouterLink>
        <RouterLink to="/finance" class="site-footer__link">金融方案</RouterLink>
        <RouterLink to="/test-drive" class="site-footer__link">预约试驾</RouterLink>
        <RouterLink to="/stores" class="site-footer__link">门店查询</RouterLink>
      </nav>

      <div class="site-footer__col">
        <p class="site-footer__title">关于</p>
        <RouterLink to="/brand" class="site-footer__link">了解我们</RouterLink>
        <RouterLink to="/service" class="site-footer__link">车主服务</RouterLink>
        <RouterLink to="/posters" class="site-footer__link">车型海报</RouterLink>
        <RouterLink to="/news" class="site-footer__link">新闻</RouterLink>
        <RouterLink to="/login" class="site-footer__link">登录</RouterLink>
        <RouterLink to="/account" class="site-footer__link">我的账户</RouterLink>
        <RouterLink to="/credits" class="site-footer__link">素材致谢</RouterLink>
        <p class="site-footer__muted">车型海报：比亚迪官网，仅毕设演示</p>
        <p class="site-footer__muted">three.js：MIT</p>
      </div>
    </div>

    <div class="container site-footer__bottom">
      <p>© 2026 车鉴 · 毕业设计演示项目，不构成真实销售要约</p>
      <p class="site-footer__muted">演示环境 · 模拟支付不产生真实扣款</p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: var(--space-8);
  border-top: 1px solid var(--line);
  background: #fff;
}

.site-footer__grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: var(--space-6);
  padding-block: var(--space-7);
}

.site-footer__logo {
  margin: 0;
}

.site-footer__logo-img {
  display: block;
  width: auto;
  height: 34px;
}

.site-footer__claim {
  margin-top: var(--space-3);
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.08em;
}

.site-footer__note {
  max-width: 36ch;
  margin-top: var(--space-3);
  color: var(--muted);
  font-size: 12px;
  line-height: 1.8;
}

.site-footer__col {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.site-footer__title {
  margin-bottom: var(--space-1);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--accent-2);
  text-transform: uppercase;
}

.site-footer__link {
  color: var(--muted);
  font-size: 13px;
  transition: color var(--duration-2) var(--ease);
}

.site-footer__link:hover {
  color: var(--text);
}

.site-footer__muted {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}

.site-footer__bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding-block: var(--space-4);
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 11px;
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
}

@media (max-width: 1024px) {
  .site-footer__grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .site-footer__grid {
    grid-template-columns: 1fr;
    padding-block: var(--space-6);
  }

  .site-footer__bottom {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>